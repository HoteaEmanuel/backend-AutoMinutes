import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { AttendeeRole } from '../enums/attendeeRole.enum';
import { NAME_MAX_LENGTH } from '../../common/constants/validation.constants';

@InputType()
export class updateAttendeeDto {
  @Field()
  @IsString()
  attendeeId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
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
