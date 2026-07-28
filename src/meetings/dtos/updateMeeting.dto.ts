import { Field, GraphQLISODateTime, InputType } from '@nestjs/graphql';
import { IsDate, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from '@common/constants/validation.constants';

@InputType()
export class UpdateMeetingDto {
  @Field()
  @IsString()
  meetingId!: string;

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

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  @IsDate()
  scheduledAt?: Date;
}
