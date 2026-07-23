import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { AttendeeRole } from '../enums/attendeeRole.enum';

@InputType()
export class addAttendeeDto {
  @Field()
  @IsString()
  name!: string;

  @Field()
  @IsString()
  meetingId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field(() => AttendeeRole, { nullable: true, defaultValue: AttendeeRole.PARTICIPANT })
  @IsOptional()
  @IsEnum(AttendeeRole)
  role?: AttendeeRole;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  userId?: string;
}
