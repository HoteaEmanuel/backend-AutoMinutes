import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ActionItemDocument } from './schemas/actionItem.schema';
import { ActionItem } from './entities/actionItem.entity';
import { Model, QueryFilter, Types } from 'mongoose';
import { CreateActionItemDto } from './dtos/createActionItem.dto';
import { DeleteActionItemDto } from './dtos/deleteActionItem.dto';
import { UpdateActionItemDto } from './dtos/updateActionItem.dto';
import { ActionItemsFilterDto } from './dtos/actionItemsFilter.dto';
import { MeetingsService } from 'src/meetings/meetings.service';
import { AttendeesService } from 'src/attendees/attendees.service';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@Injectable()
export class ActionItemsService {
  constructor(
    @InjectModel(ActionItem.name) private readonly actionItemModel: Model<ActionItemDocument>,
    private readonly meetingsService: MeetingsService,
    private readonly attendeesService: AttendeesService,
  ) {}

  async findActionItemsByMeetingId(meetingId: string) {
    return await this.actionItemModel.find({ meetingId: new Types.ObjectId(meetingId) });
  }

  async findUserActionItems(userId: string, filterDto: ActionItemsFilterDto) {
    let meetingFilter: Types.ObjectId | { $in: Types.ObjectId[] };

    if (filterDto.meetingId) {
      await this.meetingsService.findMeeting(userId, filterDto.meetingId);
      meetingFilter = new Types.ObjectId(filterDto.meetingId);
    } else {
      const userMeetings = await this.meetingsService.findAllUserMeetings(userId);
      meetingFilter = { $in: userMeetings.map((meeting) => meeting._id) };
    }

    const filter: QueryFilter<ActionItemDocument> = {
      meetingId: meetingFilter,
      ...(filterDto.assigneeId && { assigneeId: new Types.ObjectId(filterDto.assigneeId) }),
    };

    if (filterDto.search?.trim().length) {
      const regex = { $regex: escapeRegex(filterDto.search), $options: 'i' };
      filter.$or = [{ title: regex }, { description: regex }];
    }

    return await this.actionItemModel.find(filter);
  }

  async findDistinctAssignees(userId: string) {
    const userMeetings = await this.meetingsService.findAllUserMeetings(userId);
    const meetingIds = userMeetings.map((meeting) => meeting._id);

    const assigneeIds = await this.actionItemModel.distinct('assigneeId', {
      meetingId: { $in: meetingIds },
      assigneeId: { $ne: null },
    });

    return await this.attendeesService.findAttendeesByIds(assigneeIds);
  }

  async createActionItem(createActionItemDto: CreateActionItemDto) {
    const { meetingId, assigneeId, ...rest } = createActionItemDto;
    return await this.actionItemModel.create({
      ...rest,
      meetingId: new Types.ObjectId(meetingId),
      assigneeId: assigneeId ? new Types.ObjectId(assigneeId) : undefined,
    });
  }

  async updateActionItem(updateActionItemDto: UpdateActionItemDto) {
    const { meetingId, actionItemId, title, description, deadline, status, assigneeId } =
      updateActionItemDto;

    const actionItem = await this.actionItemModel.findOne({
      meetingId: new Types.ObjectId(meetingId),
      _id: new Types.ObjectId(actionItemId),
    });
    if (!actionItem) throw new NotFoundException('Action item not found');

    if (title !== undefined) actionItem.title = title;
    if (description !== undefined) actionItem.description = description;
    if (deadline !== undefined) actionItem.deadline = deadline;
    if (status !== undefined) actionItem.status = status;
    if (assigneeId !== undefined) {
      actionItem.assigneeId = assigneeId ? new Types.ObjectId(assigneeId) : undefined;
    }

    await actionItem.save();
    return actionItem;
  }

  async deleteActionItem(deleteActionItemDto: DeleteActionItemDto) {
    const actionItem = await this.actionItemModel.findOne({
      meetingId: new Types.ObjectId(deleteActionItemDto.meetingId),
      _id: new Types.ObjectId(deleteActionItemDto.actionItemId),
    });
    if (!actionItem) throw new NotFoundException('Action item not found');
    await actionItem.deleteOne();
    return actionItem;
  }
}
