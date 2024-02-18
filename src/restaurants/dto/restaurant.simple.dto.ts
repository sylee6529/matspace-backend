import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { RestaurantDto } from './restaurant.dto';

export class RestaurantSimpleDto {
  id: string;

  moodKeywords: string[];

  food_category: string | string[];

  foodCategories: string;

  menus: string[];

  constructor(data: RestaurantDto) {
    this.id = data.id;
    this.moodKeywords = data.moodKeywords;
    this.food_category = data.foodCategory;
    this.foodCategories = data.foodCategories;
    this.menus = data.menus;
  }
}
