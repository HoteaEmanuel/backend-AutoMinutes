import { Field, InputType } from '@nestjs/graphql';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { ActionItemStatus } from '../enums/actionItemsStatus';

@InputType()
export class UpdateActionItemDto {
  @Field()
  @IsString()
  meetingId!: string;

  @Field()
  @IsString()
  actionItemId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  deadline?: Date;

  @Field(() => ActionItemStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ActionItemStatus)
  status?: ActionItemStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  assigneeId?: string;
}
