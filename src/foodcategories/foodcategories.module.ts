import { Module } from '@nestjs/common';
import { FoodcategoriesController } from './foodcategories.controller';
import { FoodcategoriesService } from './foodcategories.service';

@Module({
  controllers: [FoodcategoriesController],
  providers: [FoodcategoriesService],
})
export class FoodcategoriesModule {}
