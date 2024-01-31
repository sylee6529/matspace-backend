import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RegisterRequestDto } from './dto/request/register.request.dto';
import { User } from './user.schema';
import { Model } from 'mongoose';
import { hash, isHashValid } from './../util/bcrypt.encoder';
import { JwtService } from '@nestjs/jwt';
import { UserResponseDto } from './dto/response/user.response.dto';
import { LoginRequestDto } from './dto/request/login.request.dto';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<User>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        ) {}

    async create(registerRequestDto: RegisterRequestDto): Promise<UserResponseDto> {
        try {
            const { email, username, password, friends } = registerRequestDto;
            const hashedPassword = await hash(password);
            const newUser = new this.userModel({ email, username, password: hashedPassword, friends });
            await newUser.save();
            const accessToken = this.jwtService.sign({ sub: newUser._id.toString() });
            return new UserResponseDto(accessToken, newUser.username);
        } catch (error) {
            if(error.message.includes('E11000 duplicate key error index')) {
                throw new ConflictException('이미 존재하는 email 입니다.');
            } else {
                console.log(error.message)
                throw new InternalServerErrorException();
            }
        }
    }

    async login(loginRequestDto: LoginRequestDto): Promise<{ userResponseDto: UserResponseDto }> {
        try {
            const { email, password } = loginRequestDto;
            const user = await this.userModel.findOne({ email }).exec();
            if (user && (await isHashValid(password, user.password))) {
                const accessToken = this.jwtService.sign({ sub: user._id.toString() });
                return { userResponseDto: new UserResponseDto(accessToken, user.username) };
            } else {
                throw new UnauthorizedException('login failed');
            }
        } catch (error) {
            console.log(error.message)
            throw new Error(error.message);
        }
    }
    async validate(payload: any): Promise<User> {
        return await this.userModel.findOne({ _id: payload }).exec();
    }
    

    getUserPopulated(userId: string) {
        return this.userModel.findById(userId, { _id: 1, friends: 1 }).populate(
            "friends",
            "_id username mail"
          );
    }
}
