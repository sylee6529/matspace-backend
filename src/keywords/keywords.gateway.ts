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
import { catchError, firstValueFrom, throwError } from 'rxjs';
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

    const room = this.server.in(roomId);

    try {
      const speechResponse = await firstValueFrom(
        this.httpService
          .post(`${this.baseUrl}/keywords/mood/speech`, {
            userId: userId,
            sentence: speechSentence,
          })
          .pipe(
            catchError((error) => {
              console.log('send-speech-keyword error', error);
              return throwError(() => new Error('moodspeech 요청 실패'));
            }),
          ),
      );

      console.log('응답 옴 /keywords/mood/speech', speechResponse.data.words);

      let uniqueMoods = speechResponse.data.words.reduce((acc, cur) => {
        cur.top_5_moods.forEach((mood) => {
          if (!acc.includes(mood)) {
            acc.push(mood);
          }
        });
        return acc;
      }, []);

      console.log('uniqueMoods:::', uniqueMoods);
      socket.emit('receive-speech-keyword', {
        keywords: uniqueMoods,
      });

      const restaurantResponse = await firstValueFrom(
        this.httpService
          .post(`${this.baseUrl}/restaurants/forone`, {
            userId: userId,
            roomId: roomId,
            newMoods: uniqueMoods,
            categories: selectedFoodCategories,
          })
          .pipe(
            catchError((error) => {
              console.log('send-speech-keyword error', error);
              return throwError(() => new Error('forone 요청 실패'));
            }),
          ),
      );

      console.log('before receive-키워드 emit', restaurantResponse.data.restaurant_id_list);
      room.emit('receive-recommended-restaurants', {
        restaurantList: restaurantResponse.data.restaurant_id_list,
      });
    } catch (error) {
      console.log('API error', error);
      throwError(() => error);
    }
  }

  @SubscribeMessage('all-usersHand-moodtags')
  async handleAllUsersHandMoodTags(@ConnectedSocket() socket: any, @MessageBody() data: any) {
    console.log('all-usersHand-moodtags', data);
    const roomId = data.roomId;
    const keywords = data.keywords;

    const token = socket.handshake.auth?.token;
    const payload = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
    const user = await this.authService.validate(payload.sub);
    const userId = user._id.toString();
    if (!user) {
      console.log('user not found');
      return;
    }

    const room = this.server.in(roomId);
    room.emit('all-usersHand-moodtags', {
      keywords: keywords,
    });
  }
}
