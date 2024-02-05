import { Body, Controller, Post, Query, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUserId } from 'src/util/decorator/get-user.decorator';
import { PostMoodKeywordsDto } from './dto/post-mood-keywords.dto';

@ApiTags('음식 카테고리 API')
@Controller('api/foodcategories')
export class FoodcategoriesController {
    @Post('/speech')
    @ApiOperation({ summary: 'Post mood Keywords by user speech API', description: '유저가 말한 무드 키워드를 서버로 보냅니다.' })
    @ApiCreatedResponse({ description: '무드 키워드가 잘 보내졌습니다.' })
    @UseGuards()
    async getMoodKeywordsBySpeech(
        @GetUserId() userId, 
        @Query() roomId: string, 
        @Body() speechSentence: PostMoodKeywordsDto) {
            // TODO: Fastapi로 request를 보내고, 받은 response를 다시 client에게 socket으로 보내기
        return null;
    }
}
