import { Logger, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'http';
import { Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { RoomManager } from 'src/socket/room.manager';
import { SocketService } from 'src/socket/socket.service';

@WebSocketGateway()
export class BaseGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;
  private logger: Logger = new Logger('BaseGateway');

  constructor(
    private readonly socketService: SocketService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly roomManager: RoomManager,
  ) {}

  onModuleInit() {
    this.logger.log('모듈 시작');
  }

  afterInit(server: any) {
    this.logger.log('웹소켓 서버 초기화 ✅');
  }

  handleDisconnect(socket: Socket) {
    this.logger.log(`Client Disconnected : ${socket.id}`);
  }

  async handleConnection(@ConnectedSocket() socket: Socket, ...args: any[]) {
    try {
      const userId = await this.validateUser(socket);
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

  async validateUser(socket: Socket) {
    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);

    if (!user) {
      console.log('disconnect user');
      return this.disconnect(socket, null);
    }

    return user._id.toString();
  }
}
