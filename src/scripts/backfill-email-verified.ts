import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import dbConfig from '../config/db.config';
import { DatabaseModule } from '../database/database.module';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [dbConfig] }),
    DatabaseModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
})
class BackfillModule {}

const bootstrap = async () => {
  const app = await NestFactory.createApplicationContext(BackfillModule, {
    logger: ['error', 'warn'],
  });

  try {
    const userModel = app.get<Model<User>>(getModelToken(User.name));

    // Must be $exists: false, not emailVerified: false - Mongo's { field: false }
    // filter does not match documents where the field is missing entirely, and
    // @Prop({ default: false }) only applies the default on write, not to
    // documents that predate the schema change.
    const result = await userModel.updateMany(
      { emailVerified: { $exists: false } },
      { $set: { emailVerified: true } },
    );

    console.log(`Marked ${result.modifiedCount} pre-existing user(s) as verified.`);
  } finally {
    await app.close();
  }
};

void bootstrap();
