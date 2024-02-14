import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { RestaurantDto } from './restaurant.dto';

export class RestaurantSimpleDto {
  id: string;

  moodKeywords: string[];

  foodCategory: string | string[];

  menus: string[];

  constructor(data: RestaurantDto) {
    this.id = data.id;
    this.moodKeywords = data.moodKeywords;
    this.foodCategory = data.foodCategory;
    this.menus = data.menus;
  }
}
