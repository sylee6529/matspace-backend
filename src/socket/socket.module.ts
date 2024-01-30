import { Module, forwardRef } from '@nestjs/common';
import { SocketService } from './socket.service';
import { FriendInvitation } from 'src/friend/schema/friend.invitation.schema';
import { FriendModule } from 'src/friend/friend.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    imports: [forwardRef(() => FriendModule), AuthModule],
    providers: [SocketService],
    exports: [SocketService],
})
export class SocketModule {}
