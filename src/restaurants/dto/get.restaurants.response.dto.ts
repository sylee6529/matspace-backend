import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { RestaurantDto } from './restaurant.dto';
import { ImagesDto } from './images.dto';

export class GetRestaurantsResponseDto {
  restaurantList: RestaurantDto[];
  imgUrls: ImagesDto[];
  totalCount: number;
  maxPage: number;

  constructor(restaurantList: RestaurantDto[], imgUrls: ImagesDto[], totalCount, maxPage) {
    this.restaurantList = restaurantList;
    this.imgUrls = imgUrls;
    this.totalCount = totalCount;
    this.maxPage = maxPage;
  }
}
