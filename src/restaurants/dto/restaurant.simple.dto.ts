import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { RestaurantDto } from './restaurant.dto';

export class RestaurantSimpleDto {
  id: string;

  newMoods: string[];

  food_category: string | string[];

  foodCategories: string | string[];

  menus: string[];

  coordX: number;

  coordY: number;

  constructor(restaurantDto: RestaurantDto) {
    this.id = restaurantDto._id;
    this.newMoods = restaurantDto.newMoods;
    this.food_category = restaurantDto.foodCategory;
    this.foodCategories = restaurantDto.foodCategories;
    this.menus = restaurantDto.menus;
    this.coordX = 0;
    this.coordY = 0;
  }

  setCoordinates(coordX: number, coordY: number) {
    this.coordX = coordX;
    this.coordY = coordY;
  }
}
