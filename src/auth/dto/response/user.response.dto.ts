import { Exclude } from 'class-transformer';
import { LocalDateTime } from 'js-joda';
import { User } from 'src/auth/user.schema';
import { IsEmail } from 'class-validator';

export class UserResponseDto {
  private _id: string;
  private username: string;
  private token: string;
  private email: string;
  // private refreshToken: string;

  constructor(_id: string, username: string, token: string, email: string) {
    this._id = _id;
    this.username = username;
    this.token = token;
    this.email = email;
  }
}
