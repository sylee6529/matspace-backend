import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatModule } from './cat/cat.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [CatModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }
    ),
  MongooseModule.forRootAsync({
    useFactory: async (configService: ConfigService) => ({
      uri: configService.get<string>('DATABASE_URI'),
    }),
    inject: [ConfigService],
  })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
