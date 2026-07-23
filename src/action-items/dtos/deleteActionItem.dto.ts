import { Field, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class DeleteActionItemDto {
  @Field()
  @IsString()
  meetingId!: string;

  @Field()
  @IsString()
  actionItemId!: string;
}
