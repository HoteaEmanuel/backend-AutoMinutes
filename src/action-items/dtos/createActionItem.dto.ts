import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { ActionItemStatus } from '../enums/actionItemsStatus';

@InputType()
export class CreateActionItemDto {
  @Field()
  @IsString()
  title!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field()
  @IsString()
  meetingId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  deadline?: Date;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  assigneeId?: string;

  @Field(() => ActionItemStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ActionItemStatus)
  status?: ActionItemStatus;

  @Field()
  @IsBoolean()
  aiGenerated!: boolean;
}
