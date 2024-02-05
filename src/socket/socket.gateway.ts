import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { SocketService } from './socket.service';
import { Inject, Logger, OnModuleInit, UseGuards, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { interval } from 'rxjs';
import { Interval } from '@nestjs/schedule';
import { User } from 'src/auth/user.schema';
import { JwtService } from '@nestjs/jwt';
import { RoomService } from 'src/room/room.service';
import { UserSocket } from './interface/user.handshake';
import { AuthService } from 'src/auth/auth.service';
import { FriendService } from 'src/friend/friend.service';
import { v4 as uuidv4 } from 'uuid';

@WebSocketGateway()
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  
  @WebSocketServer()
  server: Server;
  // private readonly connectedUsers: Map<string, string> = new Map();
  // private activeRooms: any[] = [];
  private roomCreatorSocketIdMap: Map<string, string> = new Map();
  private socketUserIdMap: Map<string, string> = new Map();

  private logger: Logger = new Logger('SocketGateway');

  constructor(
    private readonly socketService: SocketService,
        private readonly roomService: RoomService,
        private readonly authService: AuthService,
    private readonly jwtService: JwtService
    ) {
  }

  onModuleInit() {
    this.logger.log('모듈 시작');
    this.socketService.setSocketServerInstance(this.server);
    
  }
  
  afterInit(server: any) {
    this.logger.log('웹소켓 서버 초기화 ✅');
    // this.socketService.setSocketServerInstance(this.server);
  }

  handleDisconnect(socket: Socket) {
    this.socketService.removeConnectedUser(socket.id);
    this.logger.log(`Client Disconnected : ${socket.id}`);
  }

  async handleConnection(@ConnectedSocket() socket: Socket, ...args: any[]) {
    try {
      console.log('Client Connected :', socket.id);

      const token = socket.handshake.auth?.token;
      const payload = await this.jwtService.verify(token, {secret: process.env.JWT_SECRET});
      const user = await this.authService.validate(payload.sub);

      if (!user) {
        console.log('disconnect user');
        return this.disconnect(socket, null);
      }

      const userId = user._id.toString();
      this.socketService.addNewConnectedUser(
        socket.id,
        userId,
      );
      
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
      const userInRoom = activeRoom.participants.some(
        (participant) => participant.socketId === socket.id
      );

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
                socket.to(participant.socketId).emit("room-participant-left", {
                connUserSocketId: socket.id,
                });
            });
            }
        }
    }

  @SubscribeMessage('create-room')
    async handleRoomCreate(@MessageBody() data: string, @ConnectedSocket() socket: Socket): Promise<void> {
        console.log("handling room create event", data);
        const token = socket.handshake.auth?.token;
        const payload = await this.jwtService.verify(token, {secret: process.env.JWT_SECRET});
        const user = await this.authService.validate(payload.sub);
        // console.log("user", user)
        if(!user){
            return;
        }
        // const roomId = cryptoRandomString({length: 3, type: 'hex'})
        const roomDetails = this.socketService.addNewActiveRoom(user._id.toString(), socket.id);
        const roomId = roomDetails.roomId;
        // console.log("roomId", roomId)
        // console.log("roomDetails", roomDetails)
        socket.join(roomId);

        this.roomCreatorSocketIdMap.set(roomId, socket.id);
        this.socketUserIdMap.set(socket.id, user._id.toString());

        // console.log("room-creator-map", roomId, socket.id);
        // console.log("room-user-map", roomId, user._id.toString());
        // console.log("현재", this.roomCreatorSocketIdMap, this.socketUserIdMap);

        socket.emit("create-room-response", {
            roomId
        });

        // this.updateRooms(null);
    }

    @SubscribeMessage('join-room')
    async handleRoomJoin(@MessageBody() data: any, @ConnectedSocket() socket: Socket): Promise<void> {
      
      const roomId = data.roomId;
      console.log("handling room join event", roomId);

      const token = socket.handshake.auth?.token;
      const payload = await this.jwtService.verify(token, {secret: process.env.JWT_SECRET});
      const user = await this.authService.validate(payload.sub);

      socket.join(roomId);
      console.log("user joined room", roomId, user._id.toString());

      const room = this.server.in(roomId)
      const roomSockets = await room.fetchSockets();
      const numberOfPeopleInRoom = roomSockets.length;

      // const rooms = this.server.of("/").adapter.rooms;
      // const sids = this.server.of("/").adapter.sids;

      // console.log("rooms", rooms);
      // console.log("sids", sids);
      console.log("number of people in room", numberOfPeopleInRoom);

      if (numberOfPeopleInRoom === 2) {
        room.emit('another-person-ready');
        const creatorSocketId = this.roomCreatorSocketIdMap.get(roomId);
        const creatorId = this.socketUserIdMap.get(creatorSocketId);
        console.log("all-player-ready: creatorId, userId", creatorId, user._id.toString());

        console.log("creator is", creatorId, creatorSocketId);
        socket.to(creatorSocketId).emit('all-player-ready');

      }

      if (numberOfPeopleInRoom > 2) {
        room.emit('too-many-people');
        return;
      }

      socket.emit("join-room-response", roomId);
      
    }

    @SubscribeMessage('start-play-room')
    async handleStartPlayRoom(@MessageBody() data: any, @ConnectedSocket() socket: Socket): Promise<void> {
      console.log("handling start play room event", data);
      const roomId = data.roomId;
      const room = this.server.in(roomId);
      const token = socket.handshake.auth?.token;
      // console.log(token)
      const payload = await this.jwtService.verify(token, {secret: process.env.JWT_SECRET});
      const user = await this.authService.validate(payload.sub);
      if(!user){
        console.log("user not found");
          return;
      }
      room.emit("start-play-room-response", roomId);
    }


    @SubscribeMessage('send-connection-offer')
    async handleSendConnectionOffer(@MessageBody() {
      offer,
      roomId,
    }: {
      offer: RTCSessionDescriptionInit;
      roomId: string;
    }, @ConnectedSocket() socket: Socket): Promise<void> {
      console.log("handling send connection offer event");
      const room = this.server.in(roomId);
      const token = socket.handshake.auth?.token;
      // console.log(token)
      const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      const user = await this.authService.validate(payload.sub);
      if(!user){
        console.log("user not found");
          return;
      }
      room.except(socket.id).emit("send-connection-offer", {
        offer,
        roomId
      });
    }

    @SubscribeMessage('answer')
    async handleSendConnectionAnswer(@MessageBody() {
      answer,
      roomId,
    }: {
      answer: RTCSessionDescriptionInit;
      roomId: string;
    }, @ConnectedSocket() socket: Socket): Promise<void> {
      console.log("handling send connection answer event");
      const room = this.server.in(roomId);
      const token = socket.handshake.auth?.token;
      // console.log(token)
      const payload = await this.jwtService.verify(token, {secret: process.env.JWT_SECRET});
      const user = await this.authService.validate(payload.sub);
      if(!user){
        console.log("user not found");
          return;
      }
      room.except(socket.id).emit("answer", { answer, roomId });
    }

    @SubscribeMessage('send-candidate')
    async handleSendIceCandidate(@MessageBody() {
      candidate,
      roomId,
    }: {
      candidate: RTCIceCandidate;
      roomId: string;
    }, @ConnectedSocket() socket: Socket): Promise<void> {
      console.log("handling send ice candidate event");
      const room = this.server.in(roomId);
      const token = socket.handshake.auth?.token;
      // console.log(token)
      const payload = await this.jwtService.verify(token, {secret: process.env.JWT_SECRET});
      const user = await this.authService.validate(payload.sub);
      if(!user){
        console.log("user not found");
          return;
      }
      room.except(socket.id).emit("send-candidate", { candidate, roomId });
    }

    @SubscribeMessage('start-speech')
    async handleStartSpeech(@MessageBody() data: any, @ConnectedSocket() socket: Socket): Promise<void> {
      console.log("handling start speech event", data);
      const roomId = data.roomId;
      const room = this.server.in(roomId);
      const token = socket.handshake.auth?.token;
      // console.log(token)
      const payload = await this.jwtService.verify(token, {secret: process.env.JWT_SECRET});
      const user = await this.authService.validate(payload.sub);
      if(!user){
        console.log("user not found");
          return;
      }
      room.emit("receive-speech", user._id.toString());
    }
}