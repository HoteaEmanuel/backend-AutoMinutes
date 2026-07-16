import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TranscriptDocument = HydratedDocument<Transcript>;

@Schema({ timestamps: true })
export class Transcript {
  @Prop({ required: true })
  content!: string;

  @Prop({ required: true, ref: 'Meeting', index: true, type: Types.ObjectId })
  meetingId!: Types.ObjectId;
}

export const TranscriptSchema = SchemaFactory.createForClass(Transcript);
