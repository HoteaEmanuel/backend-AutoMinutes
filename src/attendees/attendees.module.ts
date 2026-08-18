import { Module } from '@nestjs/common';
import { AttendeesService } from './attendees.service';
import { AttendeesResolver } from './attendees.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { Attendee, AttendeeSchema } from './schemas/attendee.schema';
import { AuthModule } from '../auth/auth.module';
import { MeetingsModule } from '../meetings/meetings.module';

@Module({
  providers: [AttendeesResolver, AttendeesService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Attendee.name,
        schema: AttendeeSchema,
      },
    ]),
    AuthModule,
    MeetingsModule,
  ],
  exports: [AttendeesService],
})
export class AttendeesModule {}
