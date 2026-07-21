import { Args, Mutation, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ActionItemsService } from './action-items.service';
import { ActionItem } from './entities/actionItem.entity';
import { Meeting } from 'src/meetings/entities/meeting.entity';
import { UseGuards } from '@nestjs/common';
import { Query } from '@nestjs/graphql';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CreateActionItemDto } from './dtos/createActionItem.dto';
import { DeleteActionItemDto } from './dtos/deleteActionItem.dto';

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

  @Mutation(() => ActionItem)
  createNewActionItem(@Args('createActionItem') createActionItemDto: CreateActionItemDto) {
    return this.actionItemsService.createActionItem(createActionItemDto);
  }

  @Mutation(() => ActionItem)
  deleteActionItem(@Args('deleteActionItemDto') deleteActionItemDto: DeleteActionItemDto) {
    return this.actionItemsService.deleteActionItem(deleteActionItemDto);
  }
}
