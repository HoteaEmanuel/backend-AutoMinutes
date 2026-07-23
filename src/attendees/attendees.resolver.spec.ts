import { Test, TestingModule } from '@nestjs/testing';
import { AttendeesResolver } from './attendees.resolver';
import { AttendeesService } from './attendees.service';

describe('AttendeesResolver', () => {
  let resolver: AttendeesResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttendeesResolver, AttendeesService],
    }).compile();

    resolver = module.get<AttendeesResolver>(AttendeesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
