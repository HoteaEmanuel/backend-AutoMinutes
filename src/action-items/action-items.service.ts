import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ActionItemDocument } from './schemas/actionItem.schema';
import { ActionItem } from './entities/actionItem.entity';
import { Model, Types } from 'mongoose';
import { CreateActionItemDto } from './dtos/createActionItem.dto';
import { DeleteActionItemDto } from './dtos/deleteActionItem.dto';
import { UpdateActionItemDto } from './dtos/updateActionItem.dto';

@Injectable()
export class ActionItemsService {
  constructor(
    @InjectModel(ActionItem.name) private readonly actionItemModel: Model<ActionItemDocument>,
  ) {}

  async findActionItemsByMeetingId(meetingId: string) {
    return await this.actionItemModel.find({ meetingId });
  }

  async createActionItem(createActionItemDto: CreateActionItemDto) {
    return await this.actionItemModel.create({
      ...createActionItemDto,
    });
  }

  async updateActionItem(updateActionItemDto: UpdateActionItemDto) {
    const { meetingId, actionItemId, title, description, deadline, status, assigneeId } =
      updateActionItemDto;

    const actionItem = await this.actionItemModel.findOne({
      meetingId,
      _id: actionItemId,
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
      meetingId: deleteActionItemDto.meetingId,
      _id: deleteActionItemDto.actionItemId,
    });
    if (!actionItem) throw new NotFoundException('Action item not found');
    await actionItem.deleteOne();
    return actionItem;
  }
}
