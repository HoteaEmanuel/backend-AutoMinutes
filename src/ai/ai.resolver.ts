import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AiService } from './ai.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { AIResults } from './entities/aiResults.entity';
import { aiResultsDto } from './dtos/aiResults.dto';

@Resolver()
export class AiResolver {
  constructor(private readonly aiService: AiService) {}
  @Mutation(() => AIResults)
  @UseGuards(AuthGuard)
  async generateAIResults(@Args('aiInput') aiInput: aiResultsDto) {
    return await this.aiService.processAIResults(aiInput);
  }
}
