import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Image, ImageSchema } from './schema/images.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Image.name, schema: ImageSchema }])],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}
