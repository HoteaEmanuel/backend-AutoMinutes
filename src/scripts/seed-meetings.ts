import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import dbConfig from '@config/db.config';
import { DatabaseModule } from '@database/database.module';
import { Meeting, MeetingSchema } from '../meetings/schemas/meetings.schema';
import { MeetingStatus } from '../meetings/enums/meeting-status.enum';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [dbConfig] }),
    DatabaseModule,
    MongooseModule.forFeature([
      { name: Meeting.name, schema: MeetingSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
})
class SeedModule {}

const TITLES = [
  'Sprint Planning',
  'Sprint Review',
  'Retrospective',
  'Daily Standup',
  'Backlog Refinement',
  'Client Sync',
  'Stakeholder Update',
  'Design Review',
  'Architecture Review',
  'Security Review',
  'Bug Triage',
  'Release Planning',
  'Incident Postmortem',
  'Quarterly Roadmap',
  'All Hands',
  'Onboarding Session',
  'Vendor Demo',
  'Performance Review',
  'Accessibility Audit',
  'Database Migration Planning',
];

const DESCRIPTIONS = [
  'Scope and estimates for the upcoming sprint.',
  'Walkthrough of the AI processing flow.',
  'Reviewing open action items from last week.',
  'Deciding on the export format.',
  'Follow-up on the transcript upload spike.',
  'Token naming and dark mode coverage.',
  null,
  null,
];

const STATUSES = [
  MeetingStatus.PENDING,
  MeetingStatus.PROCESSING,
  MeetingStatus.COMPLETED,
  MeetingStatus.FAILED,
];

const buildMeetings = (owner: Types.ObjectId, count: number) =>
  Array.from({ length: count }, (_, i) => {
    const dayOffset = -30 + Math.floor((i / count) * 50);
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + dayOffset);
    scheduledAt.setHours(9 + (i % 8), (i % 4) * 15, 0, 0);

    return {
      title: `${TITLES[i % TITLES.length]} #${i + 1}`,
      description: DESCRIPTIONS[i % DESCRIPTIONS.length] ?? undefined,
      scheduledAt,
      status: STATUSES[i % STATUSES.length],
      owner,
    };
  });

const bootstrap = async () => {
  const [userIdArg, countArg] = process.argv.slice(2);

  if (!userIdArg) {
    console.error('Usage: npm run seed:meetings -- <userId> [count]');
    process.exit(1);
  }

  if (!Types.ObjectId.isValid(userIdArg)) {
    console.error(`"${userIdArg}" is not a valid Mongo ObjectId.`);
    process.exit(1);
  }

  const count = Number(countArg ?? 50);

  if (!Number.isInteger(count) || count < 1) {
    console.error(`Count must be a positive integer, got "${countArg}".`);
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['error', 'warn'],
  });

  try {
    const owner = new Types.ObjectId(userIdArg);
    const userModel = app.get<Model<User>>(getModelToken(User.name));
    const meetingModel = app.get<Model<Meeting>>(getModelToken(Meeting.name));

    const user = await userModel.findById(owner).lean();

    if (!user) {
      console.error(`No user found with id ${userIdArg}. Nothing was inserted.`);
      process.exitCode = 1;
      return;
    }

    const inserted = await meetingModel.insertMany(buildMeetings(owner, count));

    console.log(`Inserted ${inserted.length} meetings for ${user.email} (${userIdArg}).`);
  } finally {
    await app.close();
  }
};

void bootstrap();
