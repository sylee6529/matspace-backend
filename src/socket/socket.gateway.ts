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
      // console.log('Client Connected :', socket.handshake.auth);
    
      // const userSocket = socket as UserSocket;
      const token = socket.handshake.auth?.token;
      console.log('token', token);
      const payload = await this.jwtService.verify(token, {secret: process.env.JWT_SECRET});
      console.log('payload', payload);
      const user = await this.authService.validate(payload.sub);
      console.log('user', user);
      // userSocket.user = user;
  
      if (!user) {
        console.log('disconnect user');
        return this.disconnect(socket, null);
      } else {
        // console.log('do smth', socket.id);
  
        const userId = (await user)._id.toString();
        this.socketService.addNewConnectedUser(
          socket.id,
          userId,
        );
        
        this.socketService.updateFriendsPendingInvitations(userId);
  
        this.socketService.updateFriends(userId);
        console.log('user connected:', userId);
      }
    } catch (error) {
      console.log('disconnect user', error);
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
        this.roomService.handleRoomLeave(socket, { roomId: activeRoom.roomId });
      }
    });

    this.socketService.removeConnectedUser(socket.id);
  }

  @SubscribeMessage('create-room')
    async handleRoomCreate(@MessageBody() data: string, @ConnectedSocket() socket: Socket): Promise<void> {
        console.log("handling room create event", data);
        const token = socket.handshake.auth?.token;
        const payload = await this.jwtService.verify(token, {secret: process.env.JWT_SECRET});
        const user = await this.authService.validate(payload.sub);
        console.log("user", user)
        if(!user){
            return;
        }
        // const roomId = cryptoRandomString({length: 3, type: 'hex'})
        const roomDetails = this.socketService.addNewActiveRoom(user._id.toString(), socket.id);
        const roomId = roomDetails.roomId;
        console.log("roomId", roomId)
        console.log("roomDetails", roomDetails)
        socket.join(roomId);

        socket.emit("create-room-response", {
            roomId
        });

        // this.updateRooms(null);
    }

    @SubscribeMessage('join-room')
    async handleRoomJoin(@MessageBody() data: any, @ConnectedSocket() socket: Socket): Promise<void> {
      
        const roomId = data.roomId;
        console.log("handling room join event", roomId);
        // const userSocket = socket as UserSocket;

        const token = socket.handshake.auth?.token;
        // console.log(token)
        const payload = await this.jwtService.verify(token, {secret: process.env.JWT_SECRET});
        const user = await this.authService.validate(payload.sub);

        socket.join(roomId);
        console.log("user joined room", roomId, user._id.toString());

        const room = this.server.in(roomId)
        const roomSockets = await room.fetchSockets();
        const numberOfPeopleInRoom = roomSockets.length;

        socket.emit("user-joined", {
            roomId,
            userId: user._id.toString()
      });

        if (numberOfPeopleInRoom > 2) {
          room.emit('too_many_people');
          return;
        }

        socket.emit("join-room-response", 
          roomId
      );

      console.log("number of people in room", numberOfPeopleInRoom);
     
        // if (numberOfPeopleInRoom === 1) {
        //   room.emit('another_person_ready');
        // }


        // const participantDetails = {
        //     userId: user._id.toString(),
        //     socketId: socket.id,
        // };

        // const roomDetails = this.socketService.getActiveRoom(roomId);
        // this.socketService.joinActiveRoom(roomId, participantDetails);

        // // send information to users in room that they should prepare for incoming connection
        // roomDetails.participants.forEach((participant) => {
        //     if (participant.socketId !== participantDetails.socketId) {
        //     socket.to(participant.socketId).emit("conn-prepare", {
        //         connUserSocketId: participantDetails.socketId,
        //     });
        //     }
        // });

        // this.updateRooms(null);
    }
}