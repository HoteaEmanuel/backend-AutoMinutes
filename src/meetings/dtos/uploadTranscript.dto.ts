import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class UploadTranscriptDto {
  @Field()
  @IsString()
  meetingId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  content!: string;
}
