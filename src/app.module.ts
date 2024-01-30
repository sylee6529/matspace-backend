import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatModule } from './cat/cat.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { FriendService } from './friend/friend.service';
import { FriendModule } from './friend/friend.module';
import { SocketModule } from './socket/socket.module';
import { RoomController } from './room/room.controller';
import { RoomModule } from './room/room.module';
import { FriendController } from './friend/friend.controller';
import { AuthService } from './auth/auth.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [CatModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }
    ),
  MongooseModule.forRootAsync({
    useFactory: async (configService: ConfigService) => ({
      uri: configService.get<string>('DATABASE_URI'),
    }),
    inject: [ConfigService],
  }),
  AuthModule,
  FriendModule,
  SocketModule,
  RoomModule],
  controllers: [AppController, RoomController, FriendController],
  providers: [AppService, FriendService, AuthService, JwtService],
})
export class AppModule {}
