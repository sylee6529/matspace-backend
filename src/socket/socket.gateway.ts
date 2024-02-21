import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { SocketService } from './socket.service';
import { Inject, Logger, OnModuleInit, UseGuards, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { catchError, firstValueFrom, interval, throwError } from 'rxjs';
import { Interval } from '@nestjs/schedule';
import { User } from 'src/auth/user.schema';
import { JwtService } from '@nestjs/jwt';
import { UserSocket } from './interface/user.handshake';
import { AuthService } from 'src/auth/auth.service';
import { v4 as uuidv4 } from 'uuid';
import { RoomManager } from './room.manager';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { RestaurantsService } from 'src/restaurants/restaurants.service';
import { RedisService } from 'src/util/redis/redis.service';

@WebSocketGateway()
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;
  private readonly baseUrl = this.configService.get<string>('FASTAPI_BACKEND_URL');
  private logger: Logger = new Logger('SocketGateway');
  private maxRoomMemberCount = 4;

  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly roomManager: RoomManager,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly restaurantService: RestaurantsService,
    private readonly redisService: RedisService,
  ) {}

  onModuleInit() {
    this.logger.log('모듈 시작');
    // this.socketService.setSocketServerInstance(this.server);
  }

  afterInit(server: any) {
    this.logger.log('웹소켓 서버 초기화 ✅');
  }

  handleDisconnect(socket: Socket) {
    // this.socketService.removeConnectedUser(socket.id);
    this.logger.log(`Client Disconnected : ${socket.id}`);
    socket.disconnect(true);
  }

  async handleConnection(@ConnectedSocket() socket: Socket, ...args: any[]) {
    try {
      console.log('Client Connected :', socket.id);

      const token = socket.handshake.auth?.token;
      const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      const user = await this.authService.validate(payload.sub);

      if (!user) {
        console.log('disconnect user');
        return this.disconnect(socket, null);
      }

      const userId = user._id.toString();
      // this.socketService.addNewConnectedUser(socket.id, userId);

      console.log('user connected:', userId);
    } catch (error) {
      console.log('disconnect user in handle connect', error);
      return this.disconnect(socket, null);
    }
  }

  @SubscribeMessage('disconnect')
  disconnect(@ConnectedSocket() socket: Socket, data: any): void {
    console.log('handling disconnect event', socket.id, 'exit');
    socket.disconnect(true);
  }

  @SubscribeMessage('room-leave')
  handleRoomLeave(socket: Socket, data: any): void {
    const { roomId } = data;

    // const activeRoom = this.socketService.getActiveRoom(roomId);

    // if (activeRoom) {
    //   // this.socketService.leaveActiveRoom(roomId, socket.id);
    //   // const updatedActiveRoom = this.socketService.getActiveRoom(roomId);
    //   // if (updatedActiveRoom) {
    //   //   updatedActiveRoom.participants.forEach((participant) => {
    //   //     socket.to(participant.socketId).emit('room-participant-left', {
    //   //       connUserSocketId: socket.id,
    //   //     });
    //   //   });
    //   // }
    // }
  }

  @SubscribeMessage('create-room')
  async handleRoomCreate(@MessageBody() data: any, @ConnectedSocket() socket: Socket): Promise<void> {
    console.log('handling room create event', data);
    const coordinates = data.purposeCoordinate.map((coord) => parseFloat(coord));

    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);

    if (!user) {
      return;
    }

    const roomId = uuidv4();
    socket.join(roomId);
    const creatorPlayerId = this.roomManager.addCreatorToRoom(roomId, socket.id, user._id.toString());

    const roomData = this.roomManager.getRoomData(roomId);
    console.log('room-create: room data는 ', roomData);

    socket.emit('create-room-response', {
      roomId: roomId,
      socketId: user._id.toString(),
    });

    await this.restaurantService.saveRestaurants(user._id.toString(), roomId, coordinates);
    this.server.in(roomId).emit('restaurant-prepared');
  }

  @SubscribeMessage('join-room')
  async handleRoomJoin(@MessageBody() data: any, @ConnectedSocket() socket: Socket): Promise<void> {
    const roomId = data.roomId;
    console.log('handling room join event', roomId);

    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);
    const userId = user._id.toString();

    socket.join(roomId);
    const playerId = this.roomManager.addPlayerToRoom(roomId, socket.id, userId);

    console.log('user joined room', roomId, userId);
    socket.emit('join-room-response', { roomId: roomId, socketId: socket.id });

    const room = this.server.in(roomId);
    const roomSockets = await room.fetchSockets();
    const numberOfPeopleInRoom = roomSockets.length;

    // const rooms = this.server.of("/").adapter.rooms;
    // const sids = this.server.of("/").adapter.sids;

    // console.log("rooms", rooms);
    // console.log("sids", sids);
    console.log('number of people in room', numberOfPeopleInRoom);

    const roomData = this.roomManager.getRoomData(roomId);
    console.log('room-create: room data는 ', roomData);
    // console.log('user-joined: ', playerId, '입장');

    const players = this.roomManager.getPlayersInRoom(roomId);

    // for (let player of players) {
    //   socket.emit('user-joined', { socketId: socket.id });
    // }
    // room.emit('user-joined', { socketId: socket.id });

    socket.emit('all-users', players);
    console.log('all-users: ', players, 'from ', userId);

    if (numberOfPeopleInRoom >= 1) {
      room.emit('another-person-ready');
      const creatorInfo: Player = this.roomManager.getCreatorInRoom(roomId);

      const creatorSocketId = creatorInfo.socketId;
      // const creatorId = creatorInfo.userId;
      console.log('all-player-ready: creatorId, userId', creatorSocketId);

      // console.log('creator is', creatorId, creatorSocketId);
      socket.to(creatorSocketId).emit('all-player-ready');
    }

    if (numberOfPeopleInRoom > this.maxRoomMemberCount) {
      room.emit('too-many-people');
      return;
    }
  }

  @SubscribeMessage('start-play-room')
  async handleStartPlayRoom(@MessageBody() data: any, @ConnectedSocket() socket: Socket): Promise<void> {
    console.log('handling start play room event', data);
    const roomId = data.roomId;
    const coordinates = data.coordinates;

    const room = this.server.in(roomId);
    const token = socket.handshake.auth?.token;
    // console.log(token)
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);
    if (!user) {
      console.log('user not found');
      return;
    }

    const roomSockets = await room.fetchSockets();
    const numberOfPeopleInRoom = roomSockets.length;

    const players = this.roomManager.getPlayersInRoom(roomId);

    room.emit('start-play-room-response', {
      coordinates: coordinates,
      roomMemberCount: numberOfPeopleInRoom,
      players: players,
    });
  }

  @SubscribeMessage('send-connection-offer')
  async handleSendConnectionOffer(
    @MessageBody()
    {
      sdp,
      offerSendID,
      offerReceiveID,
    }: {
      sdp: RTCSessionDescriptionInit;
      roomId: string;
      offerSendID: string;
      offerReceiveID: string;
    },
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    console.log('handling send connection offer event');
    // const room = this.server.in(roomId);
    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);

    if (!user) {
      console.log('user not found');
      return;
    }

    console.log('send-connection-offer: ', offerSendID, 'to', offerReceiveID);
    this.server.to(offerReceiveID).emit('send-connection-offer', {
      sdp: sdp,
      offerSendID: offerSendID,
    });
  }

  @SubscribeMessage('answer')
  async handleSendConnectionAnswer(
    @MessageBody()
    {
      sdp,
      answerReceiveID,
      answerSendID,
    }: {
      sdp: RTCSessionDescriptionInit;
      answerReceiveID: string;
      answerSendID: string;
      roomId: string;
    },
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    console.log('handling send connection answer event');
    // const room = this.server.in(roomId);
    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);

    if (!user) {
      console.log('user not found');
      return;
    }

    console.log('answer: ', answerSendID, 'to', answerReceiveID);
    this.server.to(answerReceiveID).emit('answer', {
      sdp: sdp,
      answerSendID: answerSendID,
    });
  }

  @SubscribeMessage('send-candidate')
  async handleSendIceCandidate(
    @MessageBody()
    {
      candidate,
      candidateReceiveID,
      candidateSendID,
    }: {
      candidate: RTCIceCandidate;
      roomId: string;
      candidateReceiveID: string;
      candidateSendID: string;
    },
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    console.log('handling send ice candidate event');
    // const room = this.server.in(roomId);
    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);

    if (!user) {
      console.log('user not found');
      return;
    }

    console.log('send-candidate: ', candidateSendID, 'to', candidateReceiveID);
    this.server.to(candidateReceiveID).emit('send-candidate', {
      candidate: candidate,
      candidateSendID: candidateSendID,
    });
  }

  @SubscribeMessage('start-speech')
  async handleStartSpeech(@MessageBody() data: any, @ConnectedSocket() socket: Socket): Promise<void> {
    console.log('handling start speech event', data);
    const roomId = data.roomId;
    const room = this.server.in(roomId);
    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);

    if (!user) {
      console.log('user not found');
      return;
    }
    room.emit('receive-speech', user._id.toString());
  }

  @SubscribeMessage('select-done')
  async handleSelectDone(@MessageBody() data: any, @ConnectedSocket() socket: Socket): Promise<void> {
    console.log('handling select done event', data);
    const roomId = data.roomId;
    let currentMode = data.roomMode;
    let roomReadyCount = data.roomReadyCount;

    const room = this.server.in(roomId);
    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);

    if (!user) {
      console.log('user not found');
      return;
    }

    if (typeof currentMode === 'string') {
      currentMode = parseInt(currentMode);
    }

    let newMode = null;
    if (currentMode <= 3) {
      newMode = currentMode + 1;
    } else {
      newMode = null;
    }

    room.emit('mode-change-response', { roomReadyCount, newMode, socketId: socket.id });
  }

  @SubscribeMessage('combine-try')
  async handleCombineTry(@MessageBody() data: any, @ConnectedSocket() socket: Socket): Promise<void> {
    console.log('handling combine try event', data);
    const roomId = data.roomId;
    const combineSelects = data.combineSelects;

    const room = this.server.in(roomId);
    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);

    if (!user) {
      console.log('user not found');
      return;
    }

    room.emit('receive-combine-try', {
      combineSelects: combineSelects,
    });
  }

  @SubscribeMessage('combine-ready')
  async handleCombineReady(@MessageBody() data: any, @ConnectedSocket() socket: Socket): Promise<void> {
    console.log('handling combine ready event', data);
    const roomId = data.roomId;
    const combineSelects = data.combineSelects;
    const restaurantIdList = [1, 2, 3, 4, 5];

    const room = this.server.in(roomId);
    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);
    const userId = user._id.toString();

    if (!user) {
      console.log('user not found');
      return;
    }

    room.emit('combine-result', { restaurantList: restaurantIdList });
  }

  @SubscribeMessage('combine-select-result')
  async handleCombineSelectResult(@MessageBody() data: any, @ConnectedSocket() socket: Socket): Promise<void> {
    console.log('handling combine select result event', data);
    const roomId = data.roomId;
    const restPicks = data.restPicks;

    const room = this.server.in(roomId);
    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);

    if (!user) {
      console.log('user not found');
      return;
    }

    room.emit('combine-select-result-response', {
      restPicks: restPicks,
    });
  }

  @SubscribeMessage('combine-select-ready')
  async handleCombineSelectReady(@MessageBody() data: any, @ConnectedSocket() socket: Socket): Promise<void> {
    console.log('handling combine select ready event', data);
    const roomId = data.roomId;
    const pickedrestId = 1;

    const room = this.server.in(roomId);
    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);

    if (!user) {
      console.log('user not found');
      return;
    }

    room.emit('combine-result', {
      pickedrestId: pickedrestId,
    });
  }

  @SubscribeMessage('user-selected-card')
  async handleUserSelectedCard(@MessageBody() data: any, @ConnectedSocket() socket: Socket): Promise<void> {
    console.log('handling user selected card event', data);
    const roomId = data.roomId;
    const playerId = data.playerId;
    const restaurantData = data.restaurantData;

    const room = this.server.in(roomId);
    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);

    if (!user) {
      console.log('user not found');
      return;
    }

    room.emit('other-user-selected-card', {
      playerId: playerId,
      restaurantData: restaurantData,
    });
  }

  @SubscribeMessage('both-users-selected')
  async handleBothUsersSelected(@MessageBody() data: any, @ConnectedSocket() socket: Socket): Promise<void> {
    console.log('handling both users selected event', data);
    const roomId = data.roomId;
    const userSelectedList = data.userSelectedList;

    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);
    const userId = user._id.toString();

    const room = this.server.in(roomId);

    const coordinates = await this.redisService.getList(roomId + '_coord');
    const restIds = userSelectedList.map((obj) => obj.restId);

    const response = await firstValueFrom(
      this.httpService
        .post(`${this.baseUrl}/restaurants/formany`, {
          roomId: roomId,
          restaurant_id_list: restIds,
          user_coords: coordinates,
        })
        .pipe(
          catchError((error) => {
            console.log('restaurant for many speech api error', error);
            return throwError(() => new Error('formany 요청 실패'));
          }),
        ),
    );

    console.log('응답 옴', response.data);
    const restaurant_id_list = response.data.restaurant_id_list.map((id) => ({ id }));
    const restaurantList = await this.restaurantService.getRestaurantDtos(restaurant_id_list);
    room.emit('combined-result', { restaurantList: restaurantList });

    // room.emit('combined-result', {
    //   restaurantList: restaurantList,
    // });
  }

  @SubscribeMessage('reset-combined-area')
  async handleResetCombinedArea(@MessageBody() data: any, @ConnectedSocket() socket: Socket): Promise<void> {
    console.log('handling reset combined area event', data);
    const roomId = data.roomId;

    const room = this.server.in(roomId);
    room.emit('reset-combined-area');
  }

  @SubscribeMessage('right-sidebar-action')
  async handleRightSidebarAction(@MessageBody() data: any, @ConnectedSocket() socket: Socket): Promise<void> {
    console.log('handling right sidebar action event', data);
    const roomId = data.roomId;
    const action = data.action;
    const restaurantData = data.restaurantData;

    const room = this.server.in(roomId);
    room.emit('right-sidebar-action', {
      roomId: roomId,
      action: action,
      restaurantData: restaurantData,
      socketId: socket.id,
    });
  }

  @SubscribeMessage('remove-selected-place')
  async handleRemoveSelectedPlace(@MessageBody() data: any, @ConnectedSocket() socket: Socket): Promise<void> {
    console.log('handling remove selected place event', data);
    const roomId = data.roomId;
    const restaurantToRemoveId = data.restaurantToRemoveId;

    const room = this.server.in(roomId);
    room.emit('remove-selected-place', {
      restaurantToRemoveId: restaurantToRemoveId,
    });
  }
}
