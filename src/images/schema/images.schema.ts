import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Image extends Document {
  @Prop()
  name: string;

  @Prop()
  imgUrl: string;
}

export const ImageSchema = SchemaFactory.createForClass(Image);
