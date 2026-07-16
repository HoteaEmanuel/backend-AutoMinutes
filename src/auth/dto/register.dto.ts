import { IsString, IsEmail, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  lastName!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password!: string;
}
