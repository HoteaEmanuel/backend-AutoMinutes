import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type EmailVerificationDocument = HydratedDocument<EmailVerification>;

@Schema({ timestamps: true })
export class EmailVerification {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', unique: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, lowercase: true })
  email!: string;

  @Prop({ required: true })
  codeHash!: string;

  @Prop({ required: true, type: Date })
  expiresAt!: Date;

  @Prop({ default: 0 })
  attempts!: number;

  @Prop({ default: 0 })
  sendCount!: number;

  @Prop({ required: true, type: Date })
  lastSentAt!: Date;
}

export const EmailVerificationSchema = SchemaFactory.createForClass(EmailVerification);
// Garbage-collection only - not relied on for correctness. Mongo's TTL reaper
// runs on a ~60s cycle, so consumeCode() does its own explicit expiry check.
EmailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
