import { Module, forwardRef } from '@nestjs/common';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';
import { ConfigModule } from '@nestjs/config';
import { SocketGateway } from 'src/socket/socket.gateway';
import { SocketModule } from 'src/socket/socket.module';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { Restaurant, RestaurantSchema } from './schema/restaurant.schema';
import { ImagesModule } from 'src/images/images.module';
import { RestaurantsGateway } from './restaurants.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { AppModule } from 'src/app.module';

@Module({
  imports: [
    forwardRef(() => AppModule),
    AuthModule,
    ConfigModule.forRoot(),
    HttpModule,
    ImagesModule,
    MongooseModule.forFeature([
      {
        name: Restaurant.name,
        schema: RestaurantSchema,
      },
    ]),
  ],
  controllers: [RestaurantsController],
  providers: [RestaurantsService, RestaurantsGateway],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
