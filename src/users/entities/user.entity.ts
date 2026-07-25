import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Provider } from '@users/enums/provider.enum';

@ObjectType()
export class User {
  @Field(() => ID)
  id!: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field(() => Provider, { nullable: true })
  provider?: Provider;

  @Field()
  createdAt!: Date;
}
