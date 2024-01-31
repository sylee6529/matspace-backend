import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateFriendInvitationDto } from './dto/create.friend.invitation.dto';
import { FriendService } from './friend.service';
import { GetUserId } from 'src/util/decorator/get-user.decorator';

@Controller('api/friends/requests')
export class FriendController {
    constructor(
        private readonly friendService: FriendService,
      ) {}

      @Post('')
      invite(@GetUserId() userId, @Body() createFriendInvitationDto: CreateFriendInvitationDto): Promise<string> {
        console.log(userId)
        return this.friendService.invite(userId, createFriendInvitationDto);
      }

      @Post('accept')
      accept(@GetUserId() userId, @Body() createFriendInvitationDto: CreateFriendInvitationDto): Promise<string> {
        return this.friendService.accept(userId, createFriendInvitationDto);
      }

      @Post('reject')
      reject(@GetUserId() userId, @Body() createFriendInvitationDto: CreateFriendInvitationDto): Promise<string> {
        return this.friendService.reject(userId, createFriendInvitationDto);
      }
}
