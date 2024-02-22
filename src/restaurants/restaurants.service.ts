import { HttpService } from '@nestjs/axios';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, lastValueFrom, throwError } from 'rxjs';
import { PostRestaurantsRequestDto } from './dto/post.restaurants.request.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Restaurant } from './schema/restaurant.schema';
import { Model } from 'mongoose';
import { plainToClass } from 'class-transformer';
import { RestaurantDto } from './dto/restaurant.dto';
import { ImagesService } from 'src/images/images.service';
import { ImagesDto } from './dto/images.dto';
import { Redis } from 'ioredis';
import { RestaurantSimpleDto } from './dto/restaurant.simple.dto';
import { RedisService } from 'src/util/redis/redis.service';
import { GetRestaurantsResponseDto } from './dto/get.restaurants.response.dto';

@Injectable()
export class RestaurantsService {
  private readonly baseUrl = this.configService.get<string>('FASTAPI_BACKEND_URL');

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private imagesService: ImagesService,
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<Restaurant>,
    private readonly redisService: RedisService,
  ) {}

  async saveRestaurants(userId: string, roomId: string, coordinates: number[]) {
    const withinonekResponse = this.httpService
      .post(`${this.baseUrl}/restaurants/withinonek`, {
        userId: userId,
        base_coords: coordinates,
      })
      .pipe(
        catchError((error) => {
          console.log('error', error);
          return throwError(() => new Error('withinonek 요청 실패'));
        }),
      );
    const response = await lastValueFrom(withinonekResponse);

    const restaurantLength = response.data.num_res_within_onek;
    const starCount = Math.min(restaurantLength, 300);

    console.log('starCount', starCount);
    let closestPair = this.findClosestRatio(starCount);
    let width = Math.round(Math.sqrt(restaurantLength));
    let height = Math.round(Math.sqrt(restaurantLength));
    // let w_step = (90 - 5) / w_div;
    // let h_step = (90 - 5) / h_div;

    // console.log('w_div', width, 'h_div', height);

    let restaurantCount = 0;
    let restaurantList: (string | RestaurantSimpleDto)[] = [];

    for (const restaurantId of response.data.restaurant_id_list) {
      if (restaurantCount <= 300) {
        const restaurantInfo = await this.getRestaurantInfoById(restaurantId);
        if (restaurantInfo.food_category === undefined || restaurantInfo.foodCategories === undefined) continue;

        const restaurantDto = new RestaurantDto(restaurantId, restaurantInfo);
        const restaurantSimpleDto = new RestaurantSimpleDto(restaurantDto);

        const w = getRandomInt(5, 95);
        const h = getRandomInt(5, 85);

        // console.log('w', w, 'h', h);
        restaurantSimpleDto.setCoordinates(w, h);
        restaurantList.push(restaurantSimpleDto);
      } else {
        restaurantList.push(restaurantId);
      }

      restaurantCount++;
    }

    console.log('length and count', restaurantLength, restaurantCount);

    await this.setLocationCoordinates(roomId, coordinates);
    await this.saveRestaurantData(roomId, restaurantList).then(async () => {
      console.log('저장 완료');
    });
  }

  async getRestaurantDtos(restaurantIInfos: any[]) {
    let restaurantList = [];
    for (const restaurant of restaurantIInfos) {
      const restaurantDetail = await this.getRestaurantInfoById(restaurant.id);
      const restaurantDto = new RestaurantDto(restaurant.id, restaurantDetail);
      restaurantDto.setCoordinates(restaurant.coordX, restaurant.coordY);
      restaurantList.push(restaurantDto);
    }
    return restaurantList;
  }

  async getRestaurantList(roomId: string, page: number) {
    const perPage = 300;
    const start = (page - 1) * perPage;
    let end = start + perPage - 1;

    const count = await this.redisService.getListItemCount(roomId);
    const maxPage = Math.ceil(count / perPage);

    console.log('start', start, 'end', end, 'page', page, 'count', count, 'maxPage', maxPage);

    let restaurantSimpleList;
    if (start >= count) {
      // 시작 인덱스가 데이터 개수보다 크거나 같은 경우, 데이터가 없는 것이므로 빈 배열을 반환
      restaurantSimpleList = [];
    } else {
      if (end >= count) {
        // 끝 인덱스가 데이터 개수보다 큰 경우, 시작 인덱스부터 마지막 데이터까지만 가져옴
        end = -1;
      }

      restaurantSimpleList = await this.getRestaurantSimpleListByRange(roomId, start, end);
    }

    const restaurantInfoList = restaurantSimpleList
      .filter((item) => item.coordX !== undefined && item.coordY !== undefined)
      .map((item) => ({
        id: item.id,
        coordX: item.coordX,
        coordY: item.coordY,
      }));

    const restaurantList = await this.getRestaurantDtos(restaurantInfoList);

    let images = await this.imagesService.getAllImages();
    const imgUrls = images.map((image) => new ImagesDto(image));

    return new GetRestaurantsResponseDto(restaurantList, imgUrls, count, maxPage);
  }

  async getRestaurantInfoById(restaurantId: string) {
    const response = await this.restaurantModel.findOne({ _id: restaurantId }).exec();
    return response;
  }

  async saveRestaurantData(payload: any, data: any[]) {
    await this.redisService.setList(payload, data);
  }

  async getRestaurantSimpleList(payload: any): Promise<any[]> {
    const restaurantSimpleList = await this.redisService.getList(payload);
    const restaurantSList = restaurantSimpleList
      .filter((item) => item.coordX !== undefined && item.coordY !== undefined)
      .map((item) => ({
        id: item.id,
        coordX: item.coordX,
        coordY: item.coordY,
      }));

    return restaurantSList;
  }

  async getRestaurantSimpleListByRange(payload: any, start: number, end: number): Promise<any[]> {
    return await this.redisService.getListByRange(payload, start, end);
  }

  async setLocationCoordinates(payload: any, data: any) {
    const key = payload + '_coord';
    await this.redisService.setList(key, data);
  }

  findClosestRatio(n) {
    let lower = Math.floor(Math.sqrt(n));
    let upper = Math.ceil(n / lower);

    while (lower / upper > 2 / 3) {
      lower--;
      upper = Math.ceil(n / lower);
    }

    return [lower, upper];
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
