import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ActionItemDocument } from './schemas/actionItem.schema';
import { ActionItem } from './entities/actionItem.entity';
import { Model } from 'mongoose';
import { CreateActionItemDto } from './dtos/createActionItem.dto';
import { DeleteActionItemDto } from './dtos/deleteActionItem.dto';

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

  async deleteActionItem(deleteActionItemDto: DeleteActionItemDto) {
    const actionItem = await this.actionItemModel.findOne({
      meetingId: deleteActionItemDto.meetingId,
      id: deleteActionItemDto.actionItemId,
    });
    if (!actionItem) return new NotFoundException('Action item not found');
    await actionItem.deleteOne();
    return actionItem;
  }
}
