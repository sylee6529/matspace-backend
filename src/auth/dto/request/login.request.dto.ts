import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, MaxLength, Min, MinLength } from "class-validator";

export class LoginRequestDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ example: 'abc123@ggg.com', description: '이메일' })
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(12)
  @ApiProperty({ example: 'abcdeftg12', description: '비밀번호' })
  password: string;
}