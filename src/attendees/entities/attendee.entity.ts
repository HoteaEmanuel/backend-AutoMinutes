import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { AttendeeRole } from '../enums/attendeeRole.enum';

@ObjectType()
export class Attendee {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  email?: string;

  @Field(() => ID)
  meetingId!: Types.ObjectId;

  @Field(() => AttendeeRole)
  role!: AttendeeRole;

  @Field(() => ID, { nullable: true })
  userId?: Types.ObjectId;

  @Field({ defaultValue: false })
  aiGenerated?: boolean;
}
