import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty } from 'class-validator';

export class PostMoodKeywordsDto {
  @IsNotEmpty()
  @ArrayNotEmpty()
  @IsArray()
  @ApiProperty({ example: ['분위기가 좋은', '고즈넉한'], description: '유저가 선택한 무드 키워드 리스트' })
  readonly moodKeywords: string[];
}
