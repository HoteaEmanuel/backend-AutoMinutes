import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiResolver } from './ai.resolver';
import { AuthModule } from '../auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AIResults, AIResultsSchema } from './schemas/aiResults.schema';
import { AttendeesModule } from '../attendees/attendees.module';
import { ActionItemsModule } from '../action-items/action-items.module';
import { MeetingsModule } from '../meetings/meetings.module';

@Module({
  providers: [AiResolver, AiService],
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      {
        name: AIResults.name,
        schema: AIResultsSchema,
      },
    ]),
    AttendeesModule,
    ActionItemsModule,
    MeetingsModule,
  ],
  exports: [AiService],
})
export class AiModule {}
