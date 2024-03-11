import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class RestaurantDto {
  @Expose({ name: '_id' })
  _id: string;

  name: string;

  rating: string;

  address: string;

  menus: string[];

  thumbnailImg: string;

  phoneNumber: string;

  options: string;

  newMoods: string[];

  isDelivery: boolean | null;

  isTakeOut: boolean | null;

  images: string[];

  ratingCount: string;

  foodCategory: string | string[];

  foodCategories: string | string[];

  coordX: number;

  coordY: number;

  likes: number;

  reviews: string[];

  constructor(restaurantId: string, data: any) {
    this._id = restaurantId;
    this.name = data.name;
    this.rating = data.rating;
    this.address = data.address;
    this.menus = data.menus;
    this.thumbnailImg = data.thumbnailImg;
    this.phoneNumber = data.phone_number;
    this.options = data.options;
    this.newMoods = data.newMoods;
    this.isDelivery = data.isDelivery;
    this.isTakeOut = data.isTakeOut;
    this.images = data.images;
    this.ratingCount = data.ratingCount;
    this.foodCategory = data.food_category;
    this.foodCategories = data.foodCategories;
    this.likes = 0;
    this.reviews = data.reviews;
  }

  setCoordinates(coordX: number, coordY: number) {
    this.coordX = coordX;
    this.coordY = coordY;
  }
}
