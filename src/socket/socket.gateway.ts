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
import { interval } from 'rxjs';
import { Interval } from '@nestjs/schedule';
import { User } from 'src/auth/user.schema';
import { JwtService } from '@nestjs/jwt';
import { UserSocket } from './interface/user.handshake';
import { AuthService } from 'src/auth/auth.service';
import { v4 as uuidv4 } from 'uuid';

@WebSocketGateway()
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  private roomCreatorSocketIdMap: Map<string, string> = new Map();
  private socketUserIdMap: Map<string, string> = new Map();
  private logger: Logger = new Logger('SocketGateway');

  constructor(
    private readonly socketService: SocketService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  onModuleInit() {
    this.logger.log('모듈 시작');
    this.socketService.setSocketServerInstance(this.server);
  }

  afterInit(server: any) {
    this.logger.log('웹소켓 서버 초기화 ✅');
  }

  handleDisconnect(socket: Socket) {
    this.socketService.removeConnectedUser(socket.id);
    this.logger.log(`Client Disconnected : ${socket.id}`);
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
      this.socketService.addNewConnectedUser(socket.id, userId);

      console.log('user connected:', userId);
    } catch (error) {
      console.log('disconnect user in handle connect', error);
      return this.disconnect(socket, null);
    }
  }

  @SubscribeMessage('disconnect')
  disconnect(socket: Socket, data: any): void {
    const activeRooms = this.socketService.getActiveRooms();

    activeRooms.forEach((activeRoom) => {
      const userInRoom = activeRoom.participants.some((participant) => participant.socketId === socket.id);

      if (userInRoom) {
        this.handleRoomLeave(socket, { roomId: activeRoom.roomId });
      }
    });

    this.socketService.removeConnectedUser(socket.id);
  }

  @SubscribeMessage('room-leave')
  handleRoomLeave(socket: Socket, data: any): void {
    const { roomId } = data;

    const activeRoom = this.socketService.getActiveRoom(roomId);

    if (activeRoom) {
      this.socketService.leaveActiveRoom(roomId, socket.id);

      const updatedActiveRoom = this.socketService.getActiveRoom(roomId);

      if (updatedActiveRoom) {
        updatedActiveRoom.participants.forEach((participant) => {
          socket.to(participant.socketId).emit('room-participant-left', {
            connUserSocketId: socket.id,
          });
        });
      }
    }
  }

  @SubscribeMessage('create-room')
  async handleRoomCreate(@MessageBody() data: string, @ConnectedSocket() socket: Socket): Promise<void> {
    console.log('handling room create event', data);
    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);

    if (!user) {
      return;
    }

    const roomDetails = this.socketService.addNewActiveRoom(user._id.toString(), socket.id);
    const roomId = roomDetails.roomId;

    socket.join(roomId);

    this.roomCreatorSocketIdMap.set(roomId, socket.id);
    this.socketUserIdMap.set(socket.id, user._id.toString());
    socket.emit('create-room-response', {
      roomId,
    });
  }

  @SubscribeMessage('join-room')
  async handleRoomJoin(@MessageBody() data: any, @ConnectedSocket() socket: Socket): Promise<void> {
    const roomId = data.roomId;
    console.log('handling room join event', roomId);

    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);

    socket.join(roomId);
    console.log('user joined room', roomId, user._id.toString());
    socket.emit('join-room-response', roomId);

    const room = this.server.in(roomId);
    const roomSockets = await room.fetchSockets();
    const numberOfPeopleInRoom = roomSockets.length;

    // const rooms = this.server.of("/").adapter.rooms;
    // const sids = this.server.of("/").adapter.sids;

    // console.log("rooms", rooms);
    // console.log("sids", sids);
    console.log('number of people in room', numberOfPeopleInRoom);

    if (numberOfPeopleInRoom >= 1) {
      room.emit('another-person-ready');
      const creatorSocketId = this.roomCreatorSocketIdMap.get(roomId);
      const creatorId = this.socketUserIdMap.get(creatorSocketId);
      console.log('all-player-ready: creatorId, userId', creatorId, user._id.toString());

      console.log('creator is', creatorId, creatorSocketId);
      socket.to(creatorSocketId).emit('all-player-ready');
    }

    if (numberOfPeopleInRoom > 2) {
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

    room.emit('start-play-room-response', {
      coordinates: coordinates,
      roomMemberCount: numberOfPeopleInRoom,
    });
  }

  @SubscribeMessage('send-connection-offer')
  async handleSendConnectionOffer(
    @MessageBody()
    {
      offer,
      roomId,
    }: {
      offer: RTCSessionDescriptionInit;
      roomId: string;
    },
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    console.log('handling send connection offer event');
    const room = this.server.in(roomId);
    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);

    if (!user) {
      console.log('user not found');
      return;
    }
    room.except(socket.id).emit('send-connection-offer', {
      offer,
      roomId,
    });
  }

  @SubscribeMessage('answer')
  async handleSendConnectionAnswer(
    @MessageBody()
    {
      answer,
      roomId,
    }: {
      answer: RTCSessionDescriptionInit;
      roomId: string;
    },
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    console.log('handling send connection answer event');
    const room = this.server.in(roomId);
    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);

    if (!user) {
      console.log('user not found');
      return;
    }
    room.except(socket.id).emit('answer', { answer, roomId });
  }

  @SubscribeMessage('send-candidate')
  async handleSendIceCandidate(
    @MessageBody()
    {
      candidate,
      roomId,
    }: {
      candidate: RTCIceCandidate;
      roomId: string;
    },
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    console.log('handling send ice candidate event');
    const room = this.server.in(roomId);
    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);

    if (!user) {
      console.log('user not found');
      return;
    }
    room.except(socket.id).emit('send-candidate', { candidate, roomId });
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

    room.emit('mode-change-response', { roomReadyCount, newMode });
  }

  @SubscribeMessage('send-speech-foodCategory')
  async handleSendSpeechFoodCategory(@MessageBody() data: any, @ConnectedSocket() socket: Socket): Promise<void> {
    console.log('handling send speech food category event', data);
    const speechSentence = data.speechSentence;
    const roomId = data.roomId;
    const foodCategories = ['한식', '중식', '일식']; // TODO: Fastapi로 request를 보내고, 받은 response를 다시 client에게 socket으로 보내기

    const room = this.server.in(roomId);
    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);

    if (!user) {
      console.log('user not found');
      return;
    }
    room.emit('receive-speech-foodCategory', {
      userId: user._id.toString(),
      foodCategories,
    });
  }

  @SubscribeMessage('send-speech-keyword')
  async handleSendSpeechKeyword(@MessageBody() data: any, @ConnectedSocket() socket: Socket): Promise<void> {
    console.log('handling send speech keyword event', data);
    const speechSentence = data.speechSentence;
    const roomId = data.roomId;

    const keywords = ['조용한', '분위기있는', '초밥']; // TODO: Fastapi로 request를 보내고, 받은 response를 다시 client에게 socket으로 보내기
    const restaurantList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

    const room = this.server.in(roomId);
    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);

    if (!user) {
      console.log('user not found');
      return;
    }
    room.emit('receive-speech-keyword', {
      userId: user._id.toString(),
      keywords: keywords,
      restaurantList: restaurantList,
    });
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
    const restaurantIdList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

    const room = this.server.in(roomId);
    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);

    if (!user) {
      console.log('user not found');
      return;
    }

    room.emit('combine-result', {
      restaurantList: restaurantIdList,
    });
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
}
