import { Args, Mutation, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ActionItemsService } from './action-items.service';
import { ActionItem } from './entities/actionItem.entity';
import { Meeting } from 'src/meetings/entities/meeting.entity';
import { NotFoundException, UseGuards } from '@nestjs/common';
import { Query } from '@nestjs/graphql';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CreateActionItemDto } from './dtos/createActionItem.dto';
import { DeleteActionItemDto } from './dtos/deleteActionItem.dto';
import { UpdateActionItemDto } from './dtos/updateActionItem.dto';
import { Attendee } from 'src/attendees/entities/attendee.entity';
import { AttendeesService } from 'src/attendees/attendees.service';
import { Types } from 'mongoose';
import { ActionItemsFilterDto } from './dtos/actionItemsFilter.dto';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import type { AuthenticatedUser } from 'src/types/express';

@Resolver(() => Meeting)
@UseGuards(AuthGuard)
export class ActionItemsResolver {
  constructor(private readonly actionItemsService: ActionItemsService) {}

  @Query(() => [ActionItem])
  getActionItems(@Args('meetingId') meetingId: string) {
    return this.actionItemsService.findActionItemsByMeetingId(meetingId);
  }
  @ResolveField(() => [ActionItem])
  actionItems(@Parent() meeting: Meeting) {
    return this.actionItemsService.findActionItemsByMeetingId(meeting.id);
  }

  @Query(() => [ActionItem])
  getUserActionItems(
    @Args('filter', { nullable: true }) filter: ActionItemsFilterDto = {},
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.actionItemsService.findUserActionItems(user.userId, filter);
  }

  @Query(() => [Attendee])
  getUserActionItemAssignees(@CurrentUser() user: AuthenticatedUser) {
    return this.actionItemsService.findDistinctAssignees(user.userId);
  }

  @Mutation(() => ActionItem)
  createNewActionItem(@Args('createActionItem') createActionItemDto: CreateActionItemDto) {
    return this.actionItemsService.createActionItem(createActionItemDto);
  }

  @Mutation(() => ActionItem)
  updateActionItem(@Args('updateActionItemDto') updateActionItemDto: UpdateActionItemDto) {
    return this.actionItemsService.updateActionItem(updateActionItemDto);
  }

  @Mutation(() => ActionItem)
  deleteActionItem(@Args('deleteActionItemDto') deleteActionItemDto: DeleteActionItemDto) {
    return this.actionItemsService.deleteActionItem(deleteActionItemDto);
  }
}

@Resolver(() => ActionItem)
@UseGuards(AuthGuard)
export class ActionItemFieldsResolver {
  constructor(private readonly attendeeService: AttendeesService) {}

  @ResolveField(() => Attendee, { nullable: true })
  async assignee(@Parent() actionItem: ActionItem & { assigneeId?: Types.ObjectId }) {
    if (!actionItem.assigneeId) return null;
    try {
      return await this.attendeeService.findAttendeeById(actionItem.assigneeId.toString());
    } catch (error) {
      if (error instanceof NotFoundException) return null;
      throw error;
    }
  }
}
