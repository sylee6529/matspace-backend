import { Inject, Injectable } from '@nestjs/common';
import { Cat } from './schema/cat.schema';
import { CreateCatDto } from './dto/create-cat.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class CatService {
  constructor(@InjectModel(Cat.name) private readonly catModel: Model<Cat>) {}

  async create(createCatDto: CreateCatDto): Promise<Cat> {
    const createdCat = this.catModel.create(createCatDto);
    return createdCat;
  }

  async findAll(): Promise<Cat[]> {
    return this.catModel.find().exec();
  }
}
