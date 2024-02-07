import { Module, forwardRef } from '@nestjs/common';
import { SocketService } from './socket.service';
import { AuthModule } from 'src/auth/auth.module';
import { SocketGateway } from './socket.gateway';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [AuthModule],
  providers: [SocketService, SocketGateway],
  exports: [SocketService, SocketGateway],
})
export class SocketModule {}
