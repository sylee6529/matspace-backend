import { Test, TestingModule } from '@nestjs/testing';
import { FoodcategoriesService } from './foodcategories.service';

describe('FoodcategoriesService', () => {
  let service: FoodcategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FoodcategoriesService],
    }).compile();

    service = module.get<FoodcategoriesService>(FoodcategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
