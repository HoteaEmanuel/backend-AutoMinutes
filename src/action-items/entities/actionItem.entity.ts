import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from '@users/entities/user.entity';
import { ActionItemStatus } from '../enums/actionItemsStatus';

@ObjectType()
export class ActionItem {
  @Field()
  title!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  deadline?: Date;

  @Field(() => ActionItemStatus)
  status!: ActionItemStatus;

  @Field(() => ID)
  meetingId!: string;

  @Field(() => User, { nullable: true })
  assignee?: User;
}
