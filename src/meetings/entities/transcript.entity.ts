import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Transcript {
  @Field(() => ID)
  id!: string;

  @Field()
  content!: string;

  @Field(() => ID)
  meetingId!: string;
}
