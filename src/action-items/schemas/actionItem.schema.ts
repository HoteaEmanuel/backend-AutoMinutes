import { ActionItemStatus } from '../enums/actionItemsStatus';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
export type ActionItemDocument = HydratedDocument<ActionItem>;

@Schema({ timestamps: true })
export class ActionItem {
  @Prop({ required: true })
  title!: string;
  @Prop()
  description?: string;
  @Prop({ ref: 'Attendee', index: true, type: Types.ObjectId })
  assigneeId?: Types.ObjectId;

  @Prop()
  deadline?: Date;

  @Prop({ required: true, default: false })
  aiGenerated!: boolean;

  @Prop({ required: true, default: ActionItemStatus.OPEN })
  status!: ActionItemStatus;

  @Prop({ required: true, ref: 'Meeting', index: true, type: Types.ObjectId })
  meetingId!: Types.ObjectId;
}

export const ActionItemSchema = SchemaFactory.createForClass(ActionItem);
