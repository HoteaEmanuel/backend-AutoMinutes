import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Meeting } from './meeting.entity';

@ObjectType()
export class PaginatedMeetings {
  @Field(() => [Meeting])
  meetings!: Meeting[];

  @Field(() => Int)
  totalCount!: number;

  @Field(() => Int)
  pageNo!: number;

  @Field(() => Int)
  pageSize!: number;
}
