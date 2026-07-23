import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AttendeeRole } from '../enums/attendeeRole.enum';
export type AttendeeDocument = HydratedDocument<Attendee>;

@Schema({ timestamps: true })
export class Attendee {
  @Prop({ required: true })
  name!: string;

  @Prop()
  email?: string;

  @Prop({ required: true, ref: 'Meeting', index: true, type: Types.ObjectId })
  meetingId!: Types.ObjectId;

  @Prop({ default: AttendeeRole.PARTICIPANT, enum: AttendeeRole })
  role!: AttendeeRole;

  @Prop({ ref: 'User', index: true, type: Types.ObjectId })
  userId?: Types.ObjectId;

  @Prop({ required: true, default: false })
  aiGenerated!: boolean;
}

export const AttendeeSchema = SchemaFactory.createForClass(Attendee);
