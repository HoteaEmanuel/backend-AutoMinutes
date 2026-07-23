import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
export type AIResultsDocument = HydratedDocument<AIResults>;
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
}

export const AIResultsSchema = SchemaFactory.createForClass(AIResults);
