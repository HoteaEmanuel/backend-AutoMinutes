import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator';

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

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  onlyMine?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  scheduledFrom?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  scheduledTo?: Date;
}
