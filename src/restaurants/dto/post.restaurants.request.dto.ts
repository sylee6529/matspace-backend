import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty } from 'class-validator';

export class PostRestaurantsRequestDto {
  @IsNotEmpty()
  @ArrayNotEmpty()
  @ApiProperty({ example: [37.5001716373021, 127.029070884291], description: '위도, 경도 순으로 위치 값을 보냅니다' })
  coordinates: string[];
}
