import { HttpService } from '@nestjs/axios';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { PostRestaurantsRequestDto } from './dto/post.restaurants.request.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Restaurant } from './schema/restaurant.schema';
import { Model } from 'mongoose';
import { plainToClass } from 'class-transformer';
import { RestaurantsDto } from './dto/restaurants.dto';
import { ImagesService } from 'src/images/images.service';
import { PostRestaurantsResponseDto } from './dto/post.restaurants.response.dto';
import { ImagesDto } from './dto/images.dto';

@Injectable()
export class RestaurantsService {
  private readonly baseUrl = this.configService.get<string>('FASTAPI_BACKEND_URL');

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private imagesService: ImagesService,
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<Restaurant>,
  ) {}

  async getRestaurants(userId: string, roomId: string, coordinates: string[]) {
    const response$ = this.httpService.post(`${this.baseUrl}/restaurants/withinonek`, {
      userId: userId,
      base_coords: coordinates,
    });
    const response = await lastValueFrom(response$);

    let restaurantList = [];
    for (const restaurantId of response.data.restaurant_id_list) {
      const restaurantInfo = await this.getRestaurantInfoById(restaurantId);
      if (restaurantInfo.food_category === undefined) continue;

      const restaurantDto = new RestaurantsDto(restaurantId, restaurantInfo);
      restaurantList.push(restaurantDto);
    }

    let images = await this.imagesService.getAllImages();
    const imgUrls = images.map((image) => new ImagesDto(image));

    return new PostRestaurantsResponseDto(restaurantList, imgUrls);
  }

  async getRestaurantInfoById(restaurantId: string) {
    const response = (await this.restaurantModel.findOne({ _id: restaurantId }).exec()).toObject();

    return response;
  }
}
