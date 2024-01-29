import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, MaxLength, Min, MinLength } from "class-validator";

export class RegisterRequestDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ example: 'abc123@ggg.com', description: '이메일' })
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(12)
  @ApiProperty({ example: 'abcdeftg12', description: '비밀번호' })
  password: string;

  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(12)
  @ApiProperty({ example: '김김김', description: '유저이름' })
  username: string;
}