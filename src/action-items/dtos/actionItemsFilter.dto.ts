import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

@InputType()
export class ActionItemsFilterDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  meetingId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;
}
