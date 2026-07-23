import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { AiService } from './ai.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { AIResults } from './entities/aiResults.entity';
import { aiResultsDto } from './dtos/aiResults.dto';

@Resolver()
@UseGuards(AuthGuard)
export class AiResolver {
  constructor(private readonly aiService: AiService) {}
  @Mutation(() => AIResults)
  @UseGuards(AuthGuard)
  generateAIResults(@Args('aiInput') aiInput: aiResultsDto) {
    return this.aiService.processAIResults(aiInput);
  }

  @Query(() => AIResults)
  getAIResults(@Args('meetingId') meetingId: string) {
    return this.aiService.findAIMeetingResults(meetingId);
  }
}
