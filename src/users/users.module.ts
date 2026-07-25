import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { UsersController } from './users.controller';
import { R2Service } from './storage/r2.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { AuthModule } from 'src/auth/auth.module';
import { MeetingsModule } from 'src/meetings/meetings.module';
import { AttendeesModule } from 'src/attendees/attendees.module';
import { ActionItemsModule } from 'src/action-items/action-items.module';
import { AiModule } from 'src/ai/ai.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersResolver, R2Service],
  exports: [UsersService],
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    forwardRef(() => AuthModule),
    MeetingsModule,
    AttendeesModule,
    ActionItemsModule,
    AiModule,
  ],
})
export class UsersModule {}
