import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantsGateway } from './restaurants.gateway';

describe('RestaurantsGateway', () => {
  let gateway: RestaurantsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RestaurantsGateway],
    }).compile();

    gateway = module.get<RestaurantsGateway>(RestaurantsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
