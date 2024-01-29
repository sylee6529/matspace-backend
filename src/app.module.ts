import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatModule } from './cat/cat.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [CatModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }
    ),
  MongooseModule.forRootAsync({
    useFactory: async (configService: ConfigService) => ({
      uri: configService.get<string>('DATABASE_URI'),
    }),
    inject: [ConfigService],
  }),
  AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
