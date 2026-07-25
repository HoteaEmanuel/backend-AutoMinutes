import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsStrongPassword, MaxLength } from 'class-validator';

@InputType()
export class SetPasswordInput {
  @Field()
  @IsString()
  @MaxLength(50)
  @IsStrongPassword()
  newPassword!: string;
}
