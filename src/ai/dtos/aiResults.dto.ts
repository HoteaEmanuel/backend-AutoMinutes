import { Field, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class aiResultsDto {
  @Field()
  @IsString()
  transcript!: string;

  @Field()
  @IsString()
  meetingId!: string;
}
