import { ApiProperty } from '@nestjs/swagger';

export class CreateCatDto {
  @ApiProperty({ example: 'Tom', description: '이름' })
  readonly name: string;
  @ApiProperty({ example: 2, description: '나이' })
  readonly age: number;
  @ApiProperty({ example: 'Persian', description: '품종' })
  readonly breed: string;
}
