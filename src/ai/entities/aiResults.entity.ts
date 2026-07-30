import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { ActionItem } from 'src/action-items/entities/actionItem.entity';
import { Attendee } from 'src/attendees/entities/attendee.entity';

@ObjectType()
export class GeneratedActionItemSnapshot {
  @Field()
  description!: string;

  @Field({ nullable: true })
  assignee?: string;

  @Field({ nullable: true })
  deadline?: string;

  @Field()
  status!: string;
}

@ObjectType()
export class GeneratedAttendeeSnapshot {
  @Field()
  name!: string;

  @Field({ nullable: true })
  email?: string;

  @Field()
  role!: string;
}

@ObjectType()
export class AIResults {
  @Field(() => ID)
  id!: string;

  @Field()
  summary!: string;

  @Field({ nullable: true })
  detailedNotes?: string;

  @Field(() => [String], { nullable: true })
  decisions?: string[];

  @Field(() => ID)
  meetingId!: Types.ObjectId;

  @Field(() => [ActionItem])
  actionItems!: ActionItem[];

  @Field({ nullable: true })
  followUpNotes?: string;

  @Field(() => [Attendee])
  attendees!: Attendee[];

  @Field(() => [GeneratedActionItemSnapshot])
  generatedActionItems!: GeneratedActionItemSnapshot[];

  @Field(() => [GeneratedAttendeeSnapshot])
  generatedAttendees!: GeneratedAttendeeSnapshot[];

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;
}
