import { Module, forwardRef } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { SocketService } from 'src/socket/socket.service';
import { JwtService } from '@nestjs/jwt';
import { FriendModule } from 'src/friend/friend.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule, forwardRef(() => FriendModule)],
  controllers: [RoomController],
  providers: [RoomService, SocketService, JwtService]
})
export class RoomModule {}
