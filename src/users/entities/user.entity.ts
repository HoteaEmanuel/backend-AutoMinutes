import { Field, ObjectType } from '@nestjs/graphql';
import { Provider } from '@users/enums/provider.enum';

@ObjectType()
export class User {
  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  provider?: Provider;
}
