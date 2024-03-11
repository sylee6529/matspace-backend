import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { RestaurantDto } from './restaurant.dto';
import { ImagesDto } from './images.dto';
import { RestaurantSimpleDto } from './restaurant.simple.dto';

export class GetRestaurantsSimpleResponseDto {
  roomId: string;
  restaurantDtoList: RestaurantSimpleDto[];

  constructor(roomId: string, restaurantDtoList: RestaurantSimpleDto[]) {
    this.roomId = roomId;
    this.restaurantDtoList = restaurantDtoList;
  }
}
