import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MeetingsResolver } from './meetings.resolver';
import { MeetingsService } from './meetings.service';
import { Meeting, MeetingSchema } from './schemas/meetings.schema';
import { Transcript, TranscriptSchema } from './schemas/transcript.schema';
import { ActionItem, ActionItemSchema } from '../action-items/schemas/actionItem.schema';

@Module({
  providers: [MeetingsResolver, MeetingsService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Meeting.name,
        schema: MeetingSchema,
      },
      {
        name: Transcript.name,
        schema: TranscriptSchema,
      },
      {
        name: ActionItem.name,
        schema: ActionItemSchema,
      },
    ]),
    AuthModule,
  ],
  exports: [MeetingsService],
})
export class MeetingsModule {}
