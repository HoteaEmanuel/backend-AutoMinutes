import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, IsStrongPassword, MaxLength, MinLength } from 'class-validator';

@InputType()
export class CreateUserDto {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  firstName!: string;

  @Field()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  lastName!: string;

  @Field()
  @IsString()
  @MaxLength(50)
  @IsStrongPassword()
  password!: string;
}
