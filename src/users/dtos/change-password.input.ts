import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsStrongPassword, MaxLength } from 'class-validator';

@InputType()
export class ChangePasswordInput {
  @Field()
  @IsString()
  currentPassword!: string;

  @Field()
  @IsString()
  @MaxLength(50)
  @IsStrongPassword()
  newPassword!: string;
}
