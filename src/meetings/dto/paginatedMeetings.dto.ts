import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { MeetingStatus } from '../enums/meeting-status.enum';

@InputType()
export class PaginatedMeetingsDto {
  @Field()
  @IsInt()
  @IsPositive()
  pageSize!: number;

  @Field()
  @IsInt()
  @IsPositive()
  pageNo!: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  contentLike?: string;

  @Field(() => MeetingStatus, { nullable: true })
  @IsEnum(MeetingStatus)
  @IsOptional()
  status?: MeetingStatus;
}
