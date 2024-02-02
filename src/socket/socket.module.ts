import { Module, forwardRef } from '@nestjs/common';
import { SocketService } from './socket.service';
import { FriendInvitation } from 'src/friend/schema/friend.invitation.schema';
import { FriendModule } from 'src/friend/friend.module';
import { AuthModule } from 'src/auth/auth.module';
import { SocketGateway } from './socket.gateway';
import { RoomModule } from 'src/room/room.module';
import { RoomService } from 'src/room/room.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [forwardRef(() => FriendModule), 
        AuthModule, 
        forwardRef(() => RoomModule),
    ],
    providers: [SocketService, SocketGateway, RoomService],
    exports: [SocketService, SocketGateway],
})
export class SocketModule {}
