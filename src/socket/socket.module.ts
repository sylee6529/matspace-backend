import { Module, forwardRef } from '@nestjs/common';
import { SocketService } from './socket.service';
import { AuthModule } from 'src/auth/auth.module';
import { SocketGateway } from './socket.gateway';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RoomManager } from './room.manager';

@Module({
  imports: [AuthModule],
  providers: [SocketService, SocketGateway, RoomManager],
  exports: [SocketService, SocketGateway, RoomManager],
})
export class SocketModule {}
