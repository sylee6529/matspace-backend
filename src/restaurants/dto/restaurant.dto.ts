import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class RestaurantDto {
  @Expose({ name: '_id' })
  id: string;

  name: string;

  rating: string;

  address: string;

  menus: string[];

  thumbnailImg: string;

  @Expose({ name: 'phone_number' })
  phoneNumber: string;

  options: string;

  moodKeywords: string[];

  isDelivery: boolean | null;

  isTakeOut: boolean | null;

  images: string[];

  ratingCount: string;

  @Expose({ name: 'food_category' })
  foodCategory: string | string[];

  foodCategories: string;

  constructor(restaurantId: string, data: any) {
    this.id = restaurantId;
    this.name = data.name;
    this.rating = data.rating;
    this.address = data.address;
    this.menus = data.menus;
    this.thumbnailImg = data.thumbnailImg;
    this.phoneNumber = data.phone_number;
    this.options = data.options;
    this.moodKeywords = data.moodKeywords;
    this.isDelivery = data.isDelivery;
    this.isTakeOut = data.isTakeOut;
    this.images = data.images;
    this.ratingCount = data.ratingCount;
    this.foodCategory = data.food_category;
    this.foodCategories = data.foodCategories;
  }
}
