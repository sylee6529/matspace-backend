import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class PostSpeechSentenceDto {
  @IsNotEmpty()
  @ApiProperty({ example: '오늘 한식이 먹고 싶어요', description: '음성 인식 문장' })
  readonly speechSentence: string;
}
