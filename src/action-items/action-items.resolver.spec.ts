import { Test, TestingModule } from '@nestjs/testing';
import { ActionItemsResolver } from './action-items.resolver';
import { ActionItemsService } from './action-items.service';

describe('ActionItemsResolver', () => {
  let resolver: ActionItemsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActionItemsResolver, ActionItemsService],
    }).compile();

    resolver = module.get<ActionItemsResolver>(ActionItemsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
