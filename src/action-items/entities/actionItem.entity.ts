import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ActionItemStatus } from '../enums/actionItemsStatus';
import { Attendee } from 'src/attendees/entities/attendee.entity';

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

  @Field(() => Attendee, { nullable: true })
  assignee?: Attendee;

  @Field({ defaultValue: false })
  aiGenerated?: boolean;
}
