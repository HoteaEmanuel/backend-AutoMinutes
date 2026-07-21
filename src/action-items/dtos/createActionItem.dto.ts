import { Field, InputType } from '@nestjs/graphql';
import { IsDate, IsOptional, IsString } from 'class-validator';

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
  @IsDate()
  deadline?: Date;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  assigneeId?: string;
}
