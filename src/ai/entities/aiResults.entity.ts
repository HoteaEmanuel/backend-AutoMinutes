import { Field, ObjectType, ResolveField } from '@nestjs/graphql';
import { IsArray, IsOptional, IsString } from 'class-validator';

@ObjectType()
export class AIResults {
  @Field()
  summary!: string;

  @Field({ nullable: true })
  @IsOptional()
  detailedNotes?: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  decisions?: string[];

  //   @ResolveField(()=>[ActionItem])
  //   actionItems?: ActionItem[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  followUpNotes?: string;
}
