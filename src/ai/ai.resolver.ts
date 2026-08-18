import { Args, Mutation, Resolver, Query, ResolveField, Parent } from '@nestjs/graphql';
import { AiService } from './ai.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AIResults } from './entities/aiResults.entity';
import { aiResultsDto } from './dtos/aiResults.dto';
import { ActionItem } from '../action-items/entities/actionItem.entity';
import { ActionItemsService } from '../action-items/action-items.service';
import { Attendee } from '../attendees/entities/attendee.entity';
import { AttendeesService } from '../attendees/attendees.service';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import type { AuthenticatedUser } from '../types/express';

@Resolver(() => AIResults)
@UseGuards(AuthGuard)
export class AiResolver {
  constructor(
    private readonly aiService: AiService,
    private readonly actionItemsService: ActionItemsService,
    private readonly attendeesService: AttendeesService,
  ) {}
  @Mutation(() => AIResults)
  generateAIResults(
    @Args('aiInput') aiInput: aiResultsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aiService.processAIResults(user.userId, aiInput);
  }

  @Query(() => AIResults, { nullable: true })
  getAIResults(@Args('meetingId') meetingId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.aiService.findAIMeetingResults(user.userId, meetingId);
  }

  @Query(() => [AIResults])
  getAIResultsHistory(
    @Args('meetingId') meetingId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aiService.findAIResultsHistory(user.userId, meetingId);
  }

  @ResolveField(() => [ActionItem])
  actionItems(@Parent() aiResults: AIResults) {
    return this.actionItemsService.findActionItemsByMeetingId(aiResults.meetingId.toString());
  }

  @ResolveField(() => [Attendee])
  attendees(@Parent() aiResults: AIResults, @CurrentUser() user: AuthenticatedUser) {
    return this.attendeesService.findMeetingAttendees(user.userId, aiResults.meetingId.toString());
  }
}
