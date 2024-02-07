import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty } from 'class-validator';

export class PostFoodCategoriesDto {
  @IsNotEmpty()
  @ArrayNotEmpty()
  @IsArray()
  @ApiProperty({ example: ['한식', '일식'], description: '유저가 선택한 음식 카테고리 리스트' })
  readonly selectedCategories: string[];
}
