import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { RestaurantDto } from './restaurant.dto';
import { ImagesDto } from './images.dto';

export class PostRestaurantsResponseDto {
  restaurantList: RestaurantDto[];
  imgUrls: ImagesDto[];

  constructor(restaurantList: RestaurantDto[], imgUrls: ImagesDto[]) {
    this.restaurantList = restaurantList;
    this.imgUrls = imgUrls;
  }
}
