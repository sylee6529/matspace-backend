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
import { RoomManager } from './room.manager';

@WebSocketGateway()
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;
  private logger: Logger = new Logger('SocketGateway');
  private maxRoomMemberCount = 4;

  constructor(
    private readonly socketService: SocketService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly roomManager: RoomManager,
  ) {}

  onModuleInit() {
    this.logger.log('모듈 시작');
    this.socketService.setSocketServerInstance(this.server);
  }

  afterInit(server: any) {
    this.logger.log('웹소켓 서버 초기화 ✅');
  }

  handleDisconnect(socket: Socket) {
    this.disconnect(socket, null);
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
      console.log('user connected:', userId);
    } catch (error) {
      console.log('disconnect user in handle connect', error);
      return this.disconnect(socket, null);
    }
  }

  @SubscribeMessage('disconnect')
  disconnect(socket: Socket, data: any): void {
    console.log('handling disconnect event', data);
    socket.disconnect(true);
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
    console.log('handling room create event');
    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);

    if (!user) {
      return;
    }

    const roomDetails = this.socketService.addNewActiveRoom(user._id.toString(), socket.id);
    const roomId = roomDetails.roomId;

    socket.join(roomId);

    // this.roomCreatorSocketIdMap.set(roomId, socket.id);
    // this.socketUserIdMap.set(socket.id, user._id.toString());
    const creatorPlayerId = this.roomManager.addCreatorToRoom(roomId, socket.id, user._id.toString());

    const roomData = this.roomManager.getRoomData(roomId);
    console.log('room-create: room data는 ', roomData);

    socket.emit('create-room-response', {
      roomId: roomId,
      playerId: creatorPlayerId,
    });
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
    socket.emit('join-room-response', { roomId: roomId, playerId: playerId });

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
    console.log('user-joined: ', playerId, '입장');
    room.emit('user-joined', { playerId: playerId });

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

    const roomData = this.roomManager.getRoomData(roomId);
    console.log('start-play-room-response: room data는 ', roomData);

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
      playerId,
    }: {
      offer: RTCSessionDescriptionInit;
      roomId: string;
      playerId: string;
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
      fromPlayerId: playerId,
      offer: offer,
    });
  }

  @SubscribeMessage('answer')
  async handleSendConnectionAnswer(
    @MessageBody()
    {
      playerId,
      answer,
      roomId,
    }: {
      playerId: string;
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
    room.except(socket.id).emit('answer', { answer: answer, fromPlayerId: playerId });
  }

  @SubscribeMessage('send-candidate')
  async handleSendIceCandidate(
    @MessageBody()
    {
      candidate,
      roomId,
      playerId,
    }: {
      candidate: RTCIceCandidate;
      roomId: string;
      playerId: string;
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
    room.except(socket.id).emit('send-candidate', { candidate: candidate, fromPlayerId: playerId });
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
    const restaurantIdList = [1, 2, 3, 4, 5];

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

    const restaurantList = [
      {
        _id: '65ad3d685a419523bb358390',
        name: '나폴리회관 강남역점',
        rating: '4.29',
        address: '서울 강남구 테헤란로5길 24 1층 나폴리회관',
        thumbnailImg:
          'https://ldb-phinf.pstatic.net/20171201_130/1512077160045QAw6H_JPEG/KakaoTalk_20170815_143826958.jpg',
        phone_number: '02-538-5067',
        options:
          '예약,단체 이용 가능,주차,포장,무선 인터넷,남/녀 화장실 구분,제로페이,지역화폐 (카드형),지역화폐 (모바일형),배달,장애인 편의시설',
        moodKeywords: ['시끌벅적한', '고급스러운', '조용한', '깔끔한'],
        isDelivery: false,
        isTakeOut: false,
        images: [
          'https://ldb-phinf.pstatic.net/20171201_130/1512077160045QAw6H_JPEG/KakaoTalk_20170815_143826958.jpg',
          'https://ldb-phinf.pstatic.net/20200123_169/1579767513055YC1QV_JPEG/image.jpg',
        ],
        ratingCount: '2,909',
        food_category: '이탈리안',
      },
      {
        _id: '65ad3d685a419523bb358392',
        name: '청담이상 강남역점',
        rating: null,
        address: '서울 강남구 테헤란로1길 42 2층, 3층',
        thumbnailImg: 'https://ldb-phinf.pstatic.net/20200415_168/1586880072340Kkxru_JPEG/sCPYBc7QptWVucAU2FLURD-T.jpg',
        phone_number: '0507-1310-0027',
        options: '단체 이용 가능,예약,남/녀 화장실 구분,무선 인터넷',
        isDelivery: false,
        isTakeOut: false,
        images: [
          'https://ldb-phinf.pstatic.net/20200415_168/1586880072340Kkxru_JPEG/sCPYBc7QptWVucAU2FLURD-T.jpg',
          'https://ldb-phinf.pstatic.net/20200121_289/15795861605699d0Kq_JPEG/kiJ8lxfoIupdVhcVShnDO15q.jpg',
        ],
        ratingCount: '691',
        food_category: '바/주점',
      },
      {
        _id: '65ad3d685a419523bb358394',
        name: '감성타코 강남역점',
        rating: '4.41',
        address: '서울 강남구 강남대로 406 지하1층 감성타코',
        thumbnailImg: 'https://ldb-phinf.pstatic.net/20180922_193/1537615738091CBjnF_JPEG/QoaVnhp1U1McLCJ3gcFaHa6s.jpg',
        phone_number: '02-565-8830',
        options: '무선 인터넷,남/녀 화장실 구분,포장,단체 이용 가능,제로페이,예약',
        isDelivery: false,
        isTakeOut: true,
        images: [
          'https://ldb-phinf.pstatic.net/20180922_193/1537615738091CBjnF_JPEG/QoaVnhp1U1McLCJ3gcFaHa6s.jpg',
          'https://ldb-phinf.pstatic.net/20180922_60/1537615683256mBdbr_JPEG/vbmuzz0SH1o37i9AMjxnyblO.jpg',
        ],
        ratingCount: '2,763',
        food_category: '중남미식',
      },
    ];
    const room = this.server.in(roomId);
    room.emit('combined-result', {
      restaurantList: restaurantList,
    });
  }

  @SubscribeMessage('update-room-detail')
  async handleUpdateRoomDetail(@MessageBody() data: any, @ConnectedSocket() soccket: Socket): Promise<void> {
    console.log('handling update room detail', data);
    const roomId = data.roomId;
    const playerStreams = data.playerStreams;

    const room = this.server.in(roomId);
    room.emit('room-detail-updated', playerStreams);
  }
}
