import { HttpService } from '@nestjs/axios';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { PostRestaurantsRequestDto } from './dto/post.restaurants.request.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Restaurant } from './schema/restaurant.schema';
import { Model } from 'mongoose';
import { plainToClass } from 'class-transformer';
import { RestaurantDto } from './dto/restaurant.dto';
import { ImagesService } from 'src/images/images.service';
import { PostRestaurantsResponseDto } from './dto/post.restaurants.response.dto';
import { ImagesDto } from './dto/images.dto';
import { Redis } from 'ioredis';
import { RestaurantSimpleDto } from './dto/restaurant.simple.dto';

@Injectable()
export class RestaurantsService {
  private readonly client: Redis;
  private readonly baseUrl = this.configService.get<string>('FASTAPI_BACKEND_URL');

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private imagesService: ImagesService,
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<Restaurant>,
  ) {
    this.client = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
    });
  }

  async getRestaurants(userId: string, roomId: string, coordinates: string[]) {
    const response$ = this.httpService.post(`${this.baseUrl}/restaurants/withinonek`, {
      userId: userId,
      base_coords: coordinates,
    });
    const response = await lastValueFrom(response$);

    let restaurantList = [];
    let restaurantSimpleList = [];
    for (const restaurantId of response.data.restaurant_id_list) {
      const restaurantInfo = await this.getRestaurantInfoById(restaurantId);
      if (restaurantInfo.food_category === undefined) continue;

      const restaurantDto = new RestaurantDto(restaurantId, restaurantInfo);
      const restaurantSimpleDto = new RestaurantSimpleDto(restaurantDto);
      restaurantList.push(restaurantDto);
      restaurantSimpleList.push(restaurantSimpleDto);
    }

    await this.saveRestaurantData(roomId, restaurantSimpleList).then(async () => {
      console.log('저장 완료');
    });

    let images = await this.imagesService.getAllImages();
    const imgUrls = images.map((image) => new ImagesDto(image));

    return new PostRestaurantsResponseDto(restaurantList, imgUrls);
  }

  async getRestaurantInfoById(restaurantId: string) {
    const response = (await this.restaurantModel.findOne({ _id: restaurantId }).exec()).toObject();
    return response;
  }

  async saveRestaurantData(payload: any, data: any[]) {
    console.log('식당 정보 저장', payload.roomId);
    const dataList = data.map((item) => JSON.stringify(item));
    await this.client.lpush(payload.roomId, ...dataList);
  }

  async getRestaurantData(payload: any): Promise<any[]> {
    console.log('식당 정보 조회', payload.roomId);
    const data = await this.client.lrange(payload.roomId, 0, -1);
    return data.map((item) => JSON.parse(item));
  }
}
