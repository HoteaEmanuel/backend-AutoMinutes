import { Field, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class aiResultsDto {
  @Field()
  @IsString()
  meetingId!: string;
}
