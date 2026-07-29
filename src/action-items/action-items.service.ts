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

  private async attachAssignees(items: ActionItemDocument[]) {
    const assigneeIds = [
      ...new Set(
        items.filter((item) => item.assigneeId).map((item) => item.assigneeId!.toString()),
      ),
    ];
    const attendees = assigneeIds.length
      ? await this.attendeesService.findAttendeesByIds(
          assigneeIds.map((id) => new Types.ObjectId(id)),
        )
      : [];
    const attendeeById = new Map(attendees.map((attendee) => [attendee._id.toString(), attendee]));

    return items.map((item) =>
      Object.assign(item, {
        assignee: item.assigneeId ? (attendeeById.get(item.assigneeId.toString()) ?? null) : null,
      }),
    );
  }

  async findActionItemsByMeetingId(meetingId: string) {
    const items = await this.actionItemModel.find({ meetingId: new Types.ObjectId(meetingId) });
    return await this.attachAssignees(items);
  }

  async findActionItemsByMeetingIdForUser(
    userId: string,
    userEmail: string,
    meetingId: string,
    onlyMine?: boolean,
  ) {
    await this.meetingsService.findMeeting(userId, meetingId);

    if (onlyMine) {
      const attendee = await this.attendeesService.findAttendeeForMeetingAndUser(
        meetingId,
        userId,
        userEmail,
      );
      if (!attendee) return [];
      const items = await this.actionItemModel.find({
        meetingId: new Types.ObjectId(meetingId),
        assigneeId: attendee._id,
      });
      return items.map((item) => Object.assign(item, { assignee: attendee }));
    }

    return await this.findActionItemsByMeetingId(meetingId);
  }

  async findUserActionItems(userId: string, userEmail: string, filterDto: ActionItemsFilterDto) {
    let meetingFilter: Types.ObjectId | { $in: Types.ObjectId[] };

    if (filterDto.meetingId) {
      await this.meetingsService.findMeeting(userId, filterDto.meetingId);
      meetingFilter = new Types.ObjectId(filterDto.meetingId);
    } else {
      const userMeetings = await this.meetingsService.findAllUserMeetings(userId, {
        scheduledFrom: filterDto.scheduledFrom,
        scheduledTo: filterDto.scheduledTo,
      });
      meetingFilter = { $in: userMeetings.map((meeting) => meeting._id) };
    }

    const filter: QueryFilter<ActionItemDocument> = { meetingId: meetingFilter };

    if (filterDto.onlyMine) {
      const attendeeIds = await this.attendeesService.findAttendeeIdsForUser(userId, userEmail);
      filter.assigneeId = { $in: attendeeIds };
    } else if (filterDto.assigneeId) {
      filter.assigneeId = new Types.ObjectId(filterDto.assigneeId);
    }

    if (filterDto.search?.trim().length) {
      const regex = { $regex: escapeRegex(filterDto.search), $options: 'i' };
      filter.$or = [{ title: regex }, { description: regex }];
    }

    const items = await this.actionItemModel.find(filter);
    return await this.attachAssignees(items);
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

  async createActionItem(userId: string, createActionItemDto: CreateActionItemDto) {
    await this.meetingsService.findMeeting(userId, createActionItemDto.meetingId);
    return await this.createActionItemForVerifiedMeeting(createActionItemDto);
  }

  async createActionItemForVerifiedMeeting(createActionItemDto: CreateActionItemDto) {
    const { meetingId, assigneeId, ...rest } = createActionItemDto;
    return await this.actionItemModel.create({
      ...rest,
      meetingId: new Types.ObjectId(meetingId),
      assigneeId: assigneeId ? new Types.ObjectId(assigneeId) : undefined,
    });
  }

  async updateActionItem(userId: string, updateActionItemDto: UpdateActionItemDto) {
    const { meetingId, actionItemId, title, description, deadline, status, assigneeId } =
      updateActionItemDto;

    await this.meetingsService.findMeeting(userId, meetingId);

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

  async deleteActionItem(userId: string, deleteActionItemDto: DeleteActionItemDto) {
    await this.meetingsService.findMeeting(userId, deleteActionItemDto.meetingId);

    const actionItem = await this.actionItemModel.findOne({
      meetingId: new Types.ObjectId(deleteActionItemDto.meetingId),
      _id: new Types.ObjectId(deleteActionItemDto.actionItemId),
    });
    if (!actionItem) throw new NotFoundException('Action item not found');
    await actionItem.deleteOne();
    return actionItem;
  }

  async findManualAssigneeIds(meetingId: string) {
    return await this.actionItemModel.distinct('assigneeId', {
      meetingId: new Types.ObjectId(meetingId),
      aiGenerated: false,
      assigneeId: { $ne: null },
    });
  }

  async deleteAiGeneratedByMeetingId(meetingId: string) {
    await this.actionItemModel.deleteMany({
      meetingId: new Types.ObjectId(meetingId),
      aiGenerated: true,
    });
  }

  async deleteByMeetingIds(meetingIds: Types.ObjectId[]) {
    await this.actionItemModel.deleteMany({ meetingId: { $in: meetingIds } });
  }
}
