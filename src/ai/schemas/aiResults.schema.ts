import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
export type AIResultsDocument = HydratedDocument<AIResults>;

@Schema({ _id: false })
export class GeneratedActionItemSnapshot {
  @Prop({ required: true })
  description!: string;

  @Prop()
  assignee?: string;

  @Prop()
  deadline?: string;

  @Prop({ required: true })
  status!: string;
}
export const GeneratedActionItemSnapshotSchema = SchemaFactory.createForClass(
  GeneratedActionItemSnapshot,
);

@Schema({ _id: false })
export class GeneratedAttendeeSnapshot {
  @Prop({ required: true })
  name!: string;

  @Prop()
  email?: string;

  @Prop({ required: true })
  role!: string;
}
export const GeneratedAttendeeSnapshotSchema =
  SchemaFactory.createForClass(GeneratedAttendeeSnapshot);

@Schema({ timestamps: true })
export class AIResults {
  @Prop({ required: true })
  summary!: string;

  @Prop({ required: true, ref: 'Meeting', index: true, type: Types.ObjectId })
  meetingId!: Types.ObjectId;

  @Prop()
  detailedNotes?: string;

  @Prop(() => [String])
  decisions?: string[];

  @Prop()
  followUpNotes?: string;

  @Prop({ type: [GeneratedActionItemSnapshotSchema], default: [] })
  generatedActionItems!: GeneratedActionItemSnapshot[];

  @Prop({ type: [GeneratedAttendeeSnapshotSchema], default: [] })
  generatedAttendees!: GeneratedAttendeeSnapshot[];
}

export const AIResultsSchema = SchemaFactory.createForClass(AIResults);
