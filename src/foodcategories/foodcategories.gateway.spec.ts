import { Test, TestingModule } from '@nestjs/testing';
import { FoodcategoriesGateway } from './foodcategories.gateway';

describe('FoodcategoriesGateway', () => {
  let gateway: FoodcategoriesGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FoodcategoriesGateway],
    }).compile();

    gateway = module.get<FoodcategoriesGateway>(FoodcategoriesGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
