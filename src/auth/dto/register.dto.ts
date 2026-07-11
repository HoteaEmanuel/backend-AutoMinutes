import { IsString, IsEmail, IsStrongPassword, MaxLength, MinLength } from 'class-validator';

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
  @MaxLength(50)
  @IsStrongPassword()
  password!: string;
}
