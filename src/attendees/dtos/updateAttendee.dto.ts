import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { AttendeeRole } from '../enums/attendeeRole.enum';

@InputType()
export class updateAttendeeDto {
  @Field()
  @IsString()
  attendeeId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field(() => AttendeeRole, { nullable: true })
  @IsOptional()
  @IsEnum(AttendeeRole)
  role?: AttendeeRole;
}
