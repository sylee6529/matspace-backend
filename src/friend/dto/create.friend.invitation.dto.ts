// friend-invitation.dto.ts
import { IsEmail } from 'class-validator';

export class CreateFriendInvitationDto {
  @IsEmail()
  targetEmailAddress: string;
}
