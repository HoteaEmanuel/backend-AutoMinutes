import { Field, GraphQLISODateTime, InputType } from '@nestjs/graphql';
import { IsDate, IsNotEmpty, IsOptional, IsString, MaxLength, MinDate } from 'class-validator';
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from '../../common/constants/validation.constants';

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

@InputType()
export class CreateMeetingDto {
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

  @Field(() => GraphQLISODateTime)
  @IsDate()
  @MinDate(startOfToday, { message: 'scheduledAt must be today or a later date' })
  scheduledAt!: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  transcript?: string;
}
