import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  Res,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterRequestDto } from './dto/request/register.request.dto';
import { UserResponseDto } from './dto/response/user.response.dto';
import { LoginRequestDto } from './dto/request/login.request.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUserId } from 'src/util/decorator/get-user.decorator';
import { User } from './user.schema';

@ApiTags('유저 관련 API')
@Controller('api/users')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  @ApiOperation({ summary: '로그인', description: '일반 로그인입니다.' })
  @ApiCreatedResponse({ description: '로그인 성공' })
  async create(@Body(ValidationPipe) loginRequestDto: LoginRequestDto): Promise<{
    userDetails: UserResponseDto;
  }> {
    return this.authService.login(loginRequestDto);
  }

  @Post('/register')
  @ApiOperation({ summary: '회원가입', description: '회원가입입니다.' })
  @ApiCreatedResponse({ description: '회원가입 성공' })
  async register(
    @Body(ValidationPipe) registerRequestDto: RegisterRequestDto,
  ): Promise<{ userDetails: UserResponseDto }> {
    return this.authService.create(registerRequestDto);
  }
}
