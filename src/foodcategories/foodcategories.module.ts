import { Module } from '@nestjs/common';
import { FoodcategoriesController } from './foodcategories.controller';
import { FoodcategoriesService } from './foodcategories.service';
import { FoodcategoriesGateway } from './foodcategories.gateway';
import { ConfigModule } from '@nestjs/config';
import { SocketModule } from 'src/socket/socket.module';
import { AuthModule } from 'src/auth/auth.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [ConfigModule.forRoot(), AuthModule, HttpModule],
  controllers: [FoodcategoriesController],
  providers: [FoodcategoriesService, FoodcategoriesGateway],
})
export class FoodcategoriesModule {}
