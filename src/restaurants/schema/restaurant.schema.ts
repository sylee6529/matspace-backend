import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CatDocument = HydratedDocument<Restaurant>;

@Schema({ collection: 'restaurant' })
export class Restaurant {
  @Prop()
  name: string;

  @Prop()
  rating: string;

  @Prop()
  address: string;

  @Prop()
  thumbnailImg: string;

  @Prop()
  phone_number: string;

  @Prop()
  options: string;

  @Prop()
  moodKeywords: string[];

  @Prop()
  isDelivery: boolean;

  @Prop()
  isTakeout: boolean;

  @Prop()
  images: string[];

  @Prop()
  ratingCount: string;

  @Prop()
  food_category: string;

  @Prop()
  foodCategories: string[];
}

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);
