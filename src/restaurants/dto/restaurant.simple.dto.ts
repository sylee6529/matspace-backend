import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { RestaurantDto } from './restaurant.dto';

export class RestaurantSimpleDto {
  id: string;

  moodKeywords: string[];

  food_category: string | string[];

  foodCategories: string | string[];

  menus: string[];

  coodX: number;

  coodY: number;

  constructor(restaurantDto: RestaurantDto) {
    this.id = restaurantDto._id;
    this.moodKeywords = restaurantDto.moodKeywords;
    this.food_category = restaurantDto.foodCategory;
    this.foodCategories = restaurantDto.foodCategories;
    this.menus = restaurantDto.menus;
    this.coodX = 0;
    this.coodY = 0;
  }

  setCoordinates(coodX: number, coodY: number) {
    this.coodX = coodX;
    this.coodY = coodY;
  }
}
