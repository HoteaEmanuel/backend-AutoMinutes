import { Field, GraphQLISODateTime, InputType } from '@nestjs/graphql';
import { IsDate, IsNotEmpty, IsOptional, IsString, MaxLength, MinDate } from 'class-validator';

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
  @MaxLength(100)
  title!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
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

