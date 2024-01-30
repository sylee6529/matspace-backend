import { Module, forwardRef } from '@nestjs/common';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';
import { MongooseModule } from '@nestjs/mongoose';
import { FriendInvitationSchema } from './schema/friend.invitation.schema';
import { AuthModule } from 'src/auth/auth.module';
import { SocketModule } from 'src/socket/socket.module';
import { RoomModule } from 'src/room/room.module';

@Module({
  imports: [ 
    forwardRef(() => RoomModule),
    SocketModule,
    AuthModule,
    MongooseModule.forFeature([
      { 
        name: 'FriendInvitation', 
        schema: FriendInvitationSchema
    }])
  ],
  controllers: [FriendController],
  providers: [FriendService],
  exports: [
    FriendService,
    MongooseModule.forFeature([
      { 
        name: 'FriendInvitation', 
        schema: FriendInvitationSchema
      }
    ])
  ],
})
export class FriendModule {}
