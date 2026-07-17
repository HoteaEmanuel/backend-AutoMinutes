import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { Meeting, MeetingDocument } from './schemas/meetings.schema';
import { CreateMeetingDto } from './dto/createMeeting.dto';
import { Transcript } from './entities/transcript.entity';
import { TranscriptDocument } from './schemas/transcript.schema';
import { PaginatedMeetingsDto } from './dto/paginatedMeetings.dto';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@Injectable()
export class MeetingsService {
  constructor(
    @InjectModel(Meeting.name) private readonly meetingModel: Model<MeetingDocument>,
    @InjectModel(Transcript.name) private readonly transcriptModel: Model<TranscriptDocument>,
  ) {}

  async findAll() {
    return await this.meetingModel.find({}).sort({ scheduledAt: -1 });
  }

  async findUserMeetings(userId: string, input: PaginatedMeetingsDto) {
    const { pageNo, pageSize, contentLike } = input;

    const filter: QueryFilter<Meeting> = { owner: new Types.ObjectId(userId) };

    // Filtrez dupa titlu sau descriere

    const or: QueryFilter<Meeting>[] = [];
    if (contentLike?.trim().length)
      or.push({ title: { $regex: escapeRegex(contentLike), $options: 'i' } });
    if (contentLike?.trim().length)
      or.push({ description: { $regex: escapeRegex(contentLike), $options: 'i' } });

    if (or.length) filter.$or = or;

    if (input.status && input.status.toLowerCase() !== 'all') filter.status = input.status;

    console.log('FILTER ', filter);
    const [meetings, totalCount] = await Promise.all([
      this.meetingModel
        .find(filter)
        .sort({ scheduledAt: -1 })
        .skip((pageNo - 1) * pageSize)
        .limit(pageSize),
      this.meetingModel.countDocuments(filter),
    ]);

    return { meetings, totalCount, pageNo, pageSize };
  }

  async findMeeting(userId: string, meetingId: string) {
    const meeting = await this.meetingModel.findOne({
      _id: meetingId,
      owner: new Types.ObjectId(userId),
    });
    if (!meeting) throw new NotFoundException('Meeting was not found');
    return meeting;
  }

  async createMeeting(userId: string, createMeetingDto: CreateMeetingDto) {
    const meeting = await this.meetingModel.create({
      owner: userId,
      title: createMeetingDto.title,
      description: createMeetingDto.description,
      scheduledAt: createMeetingDto.scheduledAt,
    });
    if (createMeetingDto.transcript) {
      await this.transcriptModel.create({
        content: createMeetingDto.transcript,
        meetingId: meeting._id,
      });
    }

    return meeting;
  }

  async deleteMeeting(userId: string, meetingId: string) {
    const meeting = await this.findMeeting(userId, meetingId);
    await meeting.deleteOne();
    await this.transcriptModel.deleteMany({ meetingId });
    // ! Update cu mai multe delete uri cand sunt mai multe colectii care referentiaza
    return meeting;
  }
}
