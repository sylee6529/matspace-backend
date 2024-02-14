import { Module } from '@nestjs/common';
import { KeywordsController } from './keywords.controller';
import { KeywordsService } from './keywords.service';
import { KeywordsGateway } from './keywords.gateway';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [ConfigModule.forRoot(), AuthModule, HttpModule],
  controllers: [KeywordsController],
  providers: [KeywordsService, KeywordsGateway],
})
export class KeywordsModule {}
