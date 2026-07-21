import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Provider } from '@users/enums/provider.enum';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true })
  email!: string;

  @Prop({ required: true })
  firstName!: string;

  @Prop({ required: true })
  lastName!: string;

  @Prop({ required: false, select: false })
  passwordHash?: string;

  @Prop({ default: Provider.LOCAL, enum: Provider })
  provider!: string;

  @Prop()
  avatar?: string;
}
export const UserSchema = SchemaFactory.createForClass(User);
