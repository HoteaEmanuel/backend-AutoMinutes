import { IsString, IsEmail, IsStrongPassword, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(50)
  @IsStrongPassword()
  password!: string;
}
