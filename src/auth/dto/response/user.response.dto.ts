import { Exclude } from "class-transformer";
import { LocalDateTime } from "js-joda";
import { User } from "src/auth/user.schema";


export class UserResponseDto {
    private username: string;
    private accessToken: string;
    // private refreshToken: string;

    constructor(accessToken: string, username: string) {
        this.accessToken = accessToken;
        this.username = username;
        // this.refreshToken = refreshToken;
    }
  }