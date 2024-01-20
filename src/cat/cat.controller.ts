import { Body, Controller, Get, HttpStatus, Post, Res } from '@nestjs/common';
import { CatService } from './cat.service';
import { Cat } from './schema/cat.schema';
import { CreateCatDto } from './dto/create-cat.dto';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('test API')
@Controller('cats')
export class CatController {
    constructor(private readonly catsService: CatService) {}

    @Post()
    @ApiOperation({ summary: '고양이 생성 API', description: '고양이를 생성한다.' })
    @ApiCreatedResponse({ description: '고양이를 생성한다.', type: CreateCatDto })
    async create(@Body() createCatDto: CreateCatDto, @Res() res: Response) {
        const cat: Cat = await this.catsService.create(createCatDto);
        return res.status(HttpStatus.CREATED).json(cat);
    }

    @Get()
    async findAll(): Promise<Cat[]> {
        return this.catsService.findAll();
    }
}