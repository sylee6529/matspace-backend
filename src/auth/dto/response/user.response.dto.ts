import { Exclude } from "class-transformer";
import { LocalDateTime } from "js-joda";
import { User } from "src/auth/user.schema";


export class UserResponseDto {
    private accessToken: string;
    // private refreshToken: string;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
        // this.refreshToken = refreshToken;
    }
  }