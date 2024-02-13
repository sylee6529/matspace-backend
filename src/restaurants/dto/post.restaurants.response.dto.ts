import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { RestaurantsDto } from './restaurants.dto';
import { ImagesDto } from './images.dto';

export class PostRestaurantsResponseDto {
  restaurantList: RestaurantsDto[];
  imgUrls: ImagesDto[];

  constructor(restaurantList: RestaurantsDto[], imgUrls: ImagesDto[]) {
    this.restaurantList = restaurantList;
    this.imgUrls = imgUrls;
  }
}
