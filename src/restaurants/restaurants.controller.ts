import { Body, Controller, Get, HttpStatus, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { PostRestaurantsRequestDto } from './dto/post.restaurants.request.dto';
import { GetUserId } from 'src/util/decorator/get-user.decorator';
import { RestaurantsService } from './restaurants.service';
import { GetRestaurantsSimpleResponseDto } from './dto/get.restaurants.simple.response.dto';
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
  ): Promise<void> {
    return this.restaurantsService.saveRestaurants(userId, room.roomId, requestDto.coordinates);
  }

  @Get('/simple')
  @ApiOperation({
    summary: 'Get Restaurant object-simple list by keywords API',
    description: '특정 방의 식당 리스트를 받을 수 있습니다.',
  })
  @ApiCreatedResponse({ description: '식당 리스트 조회 완료' })
  async getRestaurants(@Query() room: { roomId: string }): Promise<GetRestaurantsSimpleResponseDto> {
    return new GetRestaurantsSimpleResponseDto(
      room.roomId,
      await this.restaurantsService.getRestaurantSimpleList(room.roomId),
    );
  }

  @Get('')
  @ApiOperation({
    summary: 'Get all restaurant object list API',
    description: '모든 식당 리스트를 받을 수 있습니다.',
  })
  @ApiCreatedResponse({ description: '식당 리스트 조회 완료' })
  async getRestaurantList(@Query() room: { roomId: string; page: number }): Promise<GetRestaurantsResponseDto> {
    return await this.restaurantsService.getRestaurantList(room.roomId, room.page);
  }
}
