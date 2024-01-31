import { Module, forwardRef } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { SocketService } from 'src/socket/socket.service';
import { JwtService } from '@nestjs/jwt';
import { FriendModule } from 'src/friend/friend.module';
import { AuthModule } from 'src/auth/auth.module';
import { SocketModule } from 'src/socket/socket.module';
import { SocketGateway } from 'src/socket/socket.gateway';

@Module({
  imports: [AuthModule, forwardRef(() => FriendModule), forwardRef(() => SocketModule)],
  controllers: [RoomController],
  providers: [RoomService, SocketService, JwtService, SocketGateway]
})
export class RoomModule {}
