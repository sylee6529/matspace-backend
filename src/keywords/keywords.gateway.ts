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
export class KeywordsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
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

  @SubscribeMessage('send-speech-keyword')
  async handleMessage(@ConnectedSocket() socket: any, @MessageBody() data: any) {
    console.log('send-speech-keyword', data);
    const roomId = data.roomId;
    const speechSentence = data.speechSentence;
    const selectedFoodCategories = data.selectedFoodCategories;

    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);
    const userId = user._id.toString();
    if (!user) {
      console.log('user not found');
      return;
    }

    const restaurantList = [
      '65ad3d685a419523bb358390',
      '65ad3d685a419523bb358392',
      '65ad3d685a419523bb358394',
      '65ad3d685a419523bb358397',
      '65ad3d685a419523bb358398',
    ];
    const room = this.server.in(roomId);
    this.httpService
      .post(`${this.baseUrl}/keywords/mood/speech`, {
        userId: userId,
        sentence: speechSentence,
      })
      .subscribe((response) => {
        // console.log('응답 옴', response.data.words);
        room.emit('receive-speech-keyword', {
          userId: userId,
          keywords: response.data.words,
          restaurantList: restaurantList,
        });
      });
  }
}
