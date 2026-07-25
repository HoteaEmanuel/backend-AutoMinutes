import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { ActionItem } from 'src/action-items/entities/actionItem.entity';
import { Attendee } from 'src/attendees/entities/attendee.entity';

@ObjectType()
export class AIResults {
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
}
