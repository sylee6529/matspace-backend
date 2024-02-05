import { Body, Controller, Post, Query, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUserId } from 'src/util/decorator/get-user.decorator';
import { PostSpeechSentenceDto } from './dto/post-speech-sentence.dto';
import { PostFoodCategoriesDto } from './dto/post-foodcategories.dto';

@ApiTags('음식 카테고리 API')
@Controller('api/foodcategories')
export class FoodcategoriesController {
    @Post('/speech')
    @ApiOperation({ summary: 'Post food categories by user speech API', description: '유저가 말한 푸드 카테고리를 서버로 보냅니다.' })
    @ApiCreatedResponse({ description: '푸드 카테고리가 잘 보내졌습니다.' })
    @UseGuards()
    async getfoodCategoriesBySpeech(
        @GetUserId() userId, 
        @Query() roomId: string, 
        @Body() speechSentence: PostSpeechSentenceDto) {
            // TODO: Fastapi로 request를 보내고, 받은 response를 다시 client에게 socket으로 보내기
        return null;
    }

    @Post('')
    @ApiOperation({ summary: 'Post a user\'s selected food categories API', description: '유저가 말한 푸드 카테고리를 서버로 보냅니다.' })
    @ApiCreatedResponse({ description: '유저가 선택한 푸드 카테고리 전송 완료.' })
    @UseGuards()
    async selectMoodKeywords (
        @GetUserId() userId, 
        @Query() roomId: string, 
        @Body() foodCategoriesDto: PostFoodCategoriesDto) {
            // TODO: 요청이 오면 하나씩 DB에 저장, Room 인원 전원이 선택 완료하면 모두에게 socket 보내기
        return null;
    }
}
