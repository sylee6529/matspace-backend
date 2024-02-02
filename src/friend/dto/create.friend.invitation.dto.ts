// friend-invitation.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class CreateFriendInvitationDto {
  @IsEmail()
  @ApiProperty({ example: 'abc123@ggg.com', description: '이메일' })
  targetEmailAddress: string;
}
