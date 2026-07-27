import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PasswordResetDocument = HydratedDocument<PasswordReset>;

@Schema({ timestamps: true })
export class PasswordReset {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', unique: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, lowercase: true })
  email!: string;

  @Prop({ required: true, unique: true })
  tokenHash!: string;

  @Prop({ required: true, type: Date })
  expiresAt!: Date;

  @Prop({ default: 0 })
  sendCount!: number;

  @Prop({ required: true, type: Date })
  lastSentAt!: Date;
}

export const PasswordResetSchema = SchemaFactory.createForClass(PasswordReset);
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
