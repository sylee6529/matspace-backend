import { Test, TestingModule } from '@nestjs/testing';
import { FoodcategoriesController } from './foodcategories.controller';

describe('FoodcategoriesController', () => {
  let controller: FoodcategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoodcategoriesController],
    }).compile();

    controller = module.get<FoodcategoriesController>(FoodcategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
