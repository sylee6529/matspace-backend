import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { RestaurantDto } from './restaurant.dto';
import { ImagesDto } from './images.dto';
import { RestaurantSimpleDto } from './restaurant.simple.dto';

export class GetRestaurantsResponseDto {
  roomId: string;
  restaurantSimpleDtoList: RestaurantSimpleDto[];

  constructor(roomId: string, restaurantSimpleDtoList: RestaurantSimpleDto[]) {
    this.roomId = roomId;
    this.restaurantSimpleDtoList = restaurantSimpleDtoList;
  }
}
