import { Body, Controller, Get, HttpStatus, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { PostRestaurantsRequestDto } from './dto/post.restaurants.request.dto';
import { GetUserId } from 'src/util/decorator/get-user.decorator';
import { RestaurantsService } from './restaurants.service';
import { PostRestaurantsResponseDto } from './dto/post.restaurants.response.dto';
import { GetRestaurantsResponseDto } from './dto/get.restaurants.response.dto';

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
  async postRestaurants(
    @GetUserId() userId,
    @Query() room: { roomId: string },
    @Body() requestDto: PostRestaurantsRequestDto,
  ): Promise<PostRestaurantsResponseDto> {
    return this.restaurantsService.getRestaurants(userId, room.roomId, requestDto.coordinates);
  }

  @Get('/simple')
  @ApiOperation({
    summary: 'Get Restaurant object-simple list by keywords API',
    description: '특정 방의 식당 리스트를 받을 수 있습니다.',
  })
  @ApiCreatedResponse({ description: '식당 리스트 조회 완료' })
  async getRestaurants(@Query() room: { roomId: string }): Promise<GetRestaurantsResponseDto> {
    return new GetRestaurantsResponseDto(room.roomId, await this.restaurantsService.getRestaurantData(room.roomId));
  }
}
