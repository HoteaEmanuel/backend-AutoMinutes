import { IsEmail, IsString, IsStrongPassword, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
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
