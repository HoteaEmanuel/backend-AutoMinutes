import { Field, InputType } from '@nestjs/graphql';
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ActionItemStatus } from '../enums/actionItemsStatus';
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from '@common/constants/validation.constants';

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
  @IsNotEmpty()
  @MaxLength(TITLE_MAX_LENGTH)
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(DESCRIPTION_MAX_LENGTH)
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
