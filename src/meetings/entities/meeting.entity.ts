import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
import { MeetingStatus } from '../enums/meeting-status.enum';
import { Transcript } from './transcript.entity';

@ObjectType()
export class Meeting {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => GraphQLISODateTime)
  scheduledAt!: Date;

  @Field(() => MeetingStatus)
  status!: MeetingStatus;

  @Field(() => Transcript, { nullable: true })
  transcript?: Transcript;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}
