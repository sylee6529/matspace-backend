import { Body, Controller, Get, HttpStatus, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { PostRestaurantsRequestDto } from './dto/post.restaurants.request.dto';
import { GetUserId } from 'src/util/decorator/get-user.decorator';
import { RestaurantsService } from './restaurants.service';
import { PostRestaurantsResponseDto } from './dto/post.restaurants.response.dto';

@ApiTags('식당 API')
@Controller('api/restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Post('')
  @ApiOperation({
    summary: 'Get Restaurants by keywords API',
    description: '교집합 추천 식당 리스트를 받을 수 있습니다.',
  })
  @ApiCreatedResponse({ description: '교집합 추천 식당 리스트 조회 완료.' })
  @UseGuards()
  async getRestaurants(
    @GetUserId() userId,
    @Query() roomId: string,
    @Body() requestDto: PostRestaurantsRequestDto,
  ): Promise<PostRestaurantsResponseDto> {
    return this.restaurantsService.getRestaurants(userId, roomId, requestDto.coordinates);
  }

  @Get('/keywords')
  @ApiOperation({
    summary: 'Get Restaurants by keywords API',
    description: '교집합 추천 식당 리스트를 받을 수 있습니다.',
  })
  @ApiCreatedResponse({ description: '교집합 추천 식당 리스트 조회 완료.' })
  @UseGuards()
  async getMoodKeywords(@Query() roomId: string) {
    const recommendedRestaurants = [
      {
        restarantId: 1,
        name: '맛있는 식당1',
        rating: 4.5,
        address: '서울시 강남구',
        thumbnailURL: 'https://www.palnews.co.kr/news/photo/201801/92969_25283_5321.jpg',
        keyword_list: ['한식', '분위기 좋은', '가성비 좋은'],
      },
      {
        restarantId: 3,
        name: '맛있는 식당2',
        rating: 4.3,
        address: '서울시 서초구',
        thumbnailURL: 'https://www.palnews.co.kr/news/photo/201801/92969_25283_5321.jpg',
        keyword_list: ['한식', '분위기 좋은', '가성비 좋은'],
      },
      {
        restarantId: 4,
        name: '맛있는 식당3',
        rating: 4.2,
        address: '서울시 성북구',
        thumbnailURL: 'https://www.palnews.co.kr/news/photo/201801/92969_25283_5321.jpg',
        keyword_list: ['한식', '분위기 좋은', '가성비 좋은'],
      },
    ];
    return recommendedRestaurants;
  }

  @Get('results')
  @ApiOperation({ summary: 'Get Restaurants Result API', description: '최총 추천 식당 결과를 받을 수 있습니다.' })
  @ApiCreatedResponse({ description: '최총 추천 식당 결 조회 완료.' })
  @UseGuards()
  async getResults(@Query() roomId: string) {
    const recommendedResults = {
      name: '맛있는 식당1',
      rating: 4.5,
      address: '서울시 강남구',
      thumbnailURL: 'https://www.palnews.co.kr/news/photo/201801/92969_25283_5321.jpg',
      menu_list: ['김치찌개', '된장찌개', '부대찌개'],
      review_list: ['김치찌개가 맛있어요', '된장찌개가 맛있어요', '부대찌개가 맛있어요'],
    };
    return recommendedResults;
  }
}
