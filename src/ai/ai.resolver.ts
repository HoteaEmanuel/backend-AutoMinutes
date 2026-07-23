import { Args, Mutation, Resolver, Query, ResolveField, Parent } from '@nestjs/graphql';
import { AiService } from './ai.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { AIResults } from './entities/aiResults.entity';
import { aiResultsDto } from './dtos/aiResults.dto';
import { ActionItem } from 'src/action-items/entities/actionItem.entity';
import { ActionItemsService } from 'src/action-items/action-items.service';
import { Attendee } from 'src/attendees/entities/attendee.entity';
import { AttendeesService } from 'src/attendees/attendees.service';

@Resolver(() => AIResults)
@UseGuards(AuthGuard)
export class AiResolver {
  constructor(
    private readonly aiService: AiService,
    private readonly actionItemsService: ActionItemsService,
    private readonly attendeesService: AttendeesService,
  ) {}
  @Mutation(() => AIResults)
  @UseGuards(AuthGuard)
  generateAIResults(@Args('aiInput') aiInput: aiResultsDto) {
    return this.aiService.processAIResults(aiInput);
  }

  @Query(() => AIResults, { nullable: true })
  getAIResults(@Args('meetingId') meetingId: string) {
    return this.aiService.findAIMeetingResults(meetingId);
  }

  @ResolveField(() => [ActionItem])
  actionItems(@Parent() aiResults: AIResults) {
    return this.actionItemsService.findActionItemsByMeetingId(aiResults.meetingId.toString());
  }

  @ResolveField(() => [Attendee])
  attendees(@Parent() aiResults: AIResults) {
    return this.attendeesService.findMeetingAttendees(aiResults.meetingId.toString());
  }
}
