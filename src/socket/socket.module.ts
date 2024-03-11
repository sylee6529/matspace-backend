import { Module, forwardRef } from '@nestjs/common';
import { SocketService } from './socket.service';
import { AuthModule } from 'src/auth/auth.module';
import { SocketGateway } from './socket.gateway';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RoomManager } from './room.manager';
import { HttpModule, HttpService } from '@nestjs/axios';
import { RestaurantsModule } from 'src/restaurants/restaurants.module';
import { RedisService } from 'src/util/redis/redis.service';
import { AppModule } from 'src/app.module';

@Module({
  imports: [AuthModule, HttpModule, ConfigModule, RestaurantsModule, forwardRef(() => AppModule)],
  providers: [SocketService, SocketGateway, RoomManager],
  exports: [SocketService, SocketGateway, RoomManager],
})
export class SocketModule {}
