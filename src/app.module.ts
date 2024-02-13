import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatModule } from './cat/cat.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { SocketModule } from './socket/socket.module';
import { AuthService } from './auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { KeywordsModule } from './keywords/keywords.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { FoodcategoriesModule } from './foodcategories/foodcategories.module';
import { ImagesModule } from './images/images.module';

@Module({
  imports: [
    CatModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URI'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    SocketModule,
    KeywordsModule,
    RestaurantsModule,
    FoodcategoriesModule,
    ImagesModule,
  ],
  controllers: [AppController],
  providers: [AppService, AuthService],
})
export class AppModule {}
