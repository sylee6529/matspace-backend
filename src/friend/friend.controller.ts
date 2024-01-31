import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateFriendInvitationDto } from './dto/create.friend.invitation.dto';
import { FriendService } from './friend.service';
import { GetUserId } from 'src/util/decorator/get-user.decorator';

@Controller('api/friends/requests')
export class FriendController {
    constructor(
        private readonly friendnService: FriendService,
      ) {}
    
      @UseGuards(AuthGuard('jwt'))
      @Post('')
      invite(@GetUserId() userId, @Body() createFriendInvitationDto: CreateFriendInvitationDto): Promise<string> {
        return this.friendnService.invite(userId, createFriendInvitationDto);
      }

      @UseGuards(AuthGuard('jwt'))
      @Post('accept')
      accept(@GetUserId() userId, @Body() createFriendInvitationDto: CreateFriendInvitationDto): Promise<string> {
        return this.friendnService.accept(userId, createFriendInvitationDto);
      }

      @UseGuards(AuthGuard('jwt'))
      @Post('reject')
      reject(@GetUserId() userId, @Body() createFriendInvitationDto: CreateFriendInvitationDto): Promise<string> {
        return this.friendnService.reject(userId, createFriendInvitationDto);
      }
}
