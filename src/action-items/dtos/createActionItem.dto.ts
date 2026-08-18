import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ActionItemStatus } from '../enums/actionItemsStatus';
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from '../../common/constants/validation.constants';

@InputType()
export class CreateActionItemDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(TITLE_MAX_LENGTH)
  title!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(DESCRIPTION_MAX_LENGTH)
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
