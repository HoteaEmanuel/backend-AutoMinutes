import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AttendeeRole } from '../enums/attendeeRole.enum';
import { NAME_MAX_LENGTH } from '@common/constants/validation.constants';

@InputType()
export class addAttendeeDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
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

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  aiGenerated?: boolean;
}
