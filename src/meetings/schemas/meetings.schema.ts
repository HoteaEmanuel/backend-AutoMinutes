import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MeetingStatus } from '../enums/meeting-status.enum';

export type MeetingDocument = HydratedDocument<Meeting>;

@Schema({ timestamps: true })
export class Meeting {
  @Prop({ required: true })
  title!: string;
  @Prop()
  description?: string;

  @Prop({ required: true })
  scheduledAt!: Date;

  @Prop({ default: MeetingStatus.PENDING, enum: MeetingStatus })
  status!: MeetingStatus;

  @Prop({ required: true, ref: 'User', index: true, type: Types.ObjectId })
  owner!: Types.ObjectId;
}

export const MeetingSchema = SchemaFactory.createForClass(Meeting);
