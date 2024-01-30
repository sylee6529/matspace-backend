import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { SocketService } from './socket.service';
import { Logger, OnModuleInit, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomService } from './../room/room.service';
import { interval } from 'rxjs';
import { Interval } from '@nestjs/schedule';
import { User } from 'src/auth/user.schema';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserSocket } from './interface/user.handshake';

@WebSocketGateway({ cors: { origin: '*', methods: ['GET', 'POST'], namespace: 'vcall'} })
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('SocketGateway');

  constructor(
    private readonly socketService: SocketService,
    private readonly roomService: RoomService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService
    ) {
  }

  onModuleInit() {
    this.socketService.setSocketServerInstance(this.server);
  }
  
  afterInit(server: any) {
    this.logger.log('웹소켓 서버 초기화 ✅');
  }

  handleDisconnect(socket: Socket) {
    this.socketService.removeConnectedUser(socket.id);
    this.logger.log(`Client Disconnected : ${socket.id}`);
  }

  @Interval(500)
  async handleConnection(socket: Socket, ...args: any[]) {
    try {
      const userSocket = socket as UserSocket;
      const token = userSocket.handshake.auth?.token;
      const userId = this.jwtService.verify(token);
      const user = await this.authService.validate(userId);
      userSocket.user = user;
  
      if (!user) {
        console.log('disconnect user');
        return this.disconnect(socket, null);
      } else {
        console.log('do smth', user);
  
        const userId = (await user)._id.toString()
        this.socketService.addNewConnectedUser(
          socket.id,
          userId,
        );
        
  
        // update pending friends invitations list
        this.socketService.updateFriendsPendingInvitations(userId);
  
        // update friends list
        this.socketService.updateFriends(userId);
        console.log('user connected: ${client.id}');
      }
    } catch (error) {
      console.log('disconnect user');
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
