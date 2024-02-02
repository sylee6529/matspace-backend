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

@WebSocketGateway(3000, { cors: { origin: '*'},transports: ['websocket']})
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
      console.log('Client Connected :', socket.handshake.auth);
    
      const userSocket = socket as UserSocket;
      const token = userSocket.handshake.auth?.token;
      console.log('token', token);

      const payload = await this.jwtService.verify(token, {secret: process.env.JWT_SECRET});
      console.log('userId', payload);
      const user = await this.authService.validate(payload.sub);
      console.log
      // userSocket.user = user;
  
      if (!user) {
        console.log('disconnect user');
        return this.disconnect(socket, null);
      } else {
        console.log('do smth', socket.id);
  
        const userId = (await user)._id.toString();
        this.socketService.addNewConnectedUser(
          socket.id,
          userId,
        );
        
        this.socketService.updateFriendsPendingInvitations(userId);
  
        this.socketService.updateFriends(userId);
        console.log('user connected: ${client.id}');
      }
    } catch (error) {
      console.log('disconnect user', error);
      return this.disconnect(socket, null);
    }
  }
  
  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }

  @SubscribeMessage('conn-init')
  handleConnInit(socket: Socket, data: any): void {
    const { connUserSocketId } = data;

    const initData = { connUserSocketId: socket.id };
    socket.to(connUserSocketId).emit("conn-init", initData);
  }

  @SubscribeMessage('conn-signal')
  handleConnSignal(socket: Socket, data: any): void {
    const { connUserSocketId, signal } = data;

    const signalingData = { signal, connUserSocketId: socket.id };
    socket.to(connUserSocketId).emit("conn-signal", signalingData);
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

  @Interval(8000)
  emitOnlineUsers() {
    const onlineUsers = this.socketService.getOnlineUsers();
    this.server.emit("online-users", { onlineUsers });
  }
}