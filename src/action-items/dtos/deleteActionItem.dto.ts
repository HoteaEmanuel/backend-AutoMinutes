import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class DeleteActionItemDto {
  @Field()
  meetingId!: string;

  @Field()
  actionItemId!: string;
}
