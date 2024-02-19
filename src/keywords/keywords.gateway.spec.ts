import { Test, TestingModule } from '@nestjs/testing';
import { KeywordsGateway } from './keywords.gateway';

describe('KeywordsGateway', () => {
  let gateway: KeywordsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KeywordsGateway],
    }).compile();

    gateway = module.get<KeywordsGateway>(KeywordsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
