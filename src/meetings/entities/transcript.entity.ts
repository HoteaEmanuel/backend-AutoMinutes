import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Transcript {
  @Field(() => ID)
  id!: string;

  @Field()
  content!: string;

  @Field(() => ID)
  meetingId!: string;

  @Field()
  isActive!: boolean;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;
}
