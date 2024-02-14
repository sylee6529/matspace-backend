import { HttpService } from '@nestjs/axios';
import { Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
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
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';

@WebSocketGateway()
export class FoodcategoriesGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  private readonly baseUrl = this.configService.get<string>('FASTAPI_BACKEND_URL');
  private logger: Logger = new Logger('SocketGateway');

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  onModuleInit() {
    this.logger.log('FoodcategoriesGateway 모듈 시작');
    // this.socketService.setSocketServerInstance(this.server);
  }

  afterInit(server: any) {
    this.logger.log('웹소켓 서버 초기화 ✅ FoodcategoriesGateway');
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
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

  @SubscribeMessage('send-speech-foodCategory')
  async handleMessage(@ConnectedSocket() socket: any, @MessageBody() data: any) {
    console.log('send-speech-foodCategory', data);
    const roomId = data.roomId;
    const speechSentence = data.speechSentence;

    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);
    const userId = user._id.toString();
    if (!user) {
      console.log('user not found');
      return;
    }

    const room = this.server.in(roomId);
    this.httpService
      .post(`${this.baseUrl}/foodcategories/speech`, {
        userId: userId,
        sentence: speechSentence,
      })
      .subscribe((response) => {
        // console.log('응답 옴', response.data);
        room.emit('receive-speech-foodCategory', { userId: userId, foodCategories: response.data.words });
      });
  }

  @SubscribeMessage('select-foodCategories')
  async handleSelectFoodCategories(@ConnectedSocket() socket: any, @MessageBody() data: any) {
    console.log('select-foodCategories', data);
    const roomId = data.roomId;
    const resultList = data.resultList;

    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);
    const userId = user._id.toString();
    if (!user) {
      console.log('user not found');
      return;
    }

    const room = this.server.in(roomId);
    room.emit('select-foodCategories', resultList);
  }
}
