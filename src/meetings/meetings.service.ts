import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, StrictCondition, Types } from 'mongoose';
import { Meeting, MeetingDocument } from './schemas/meetings.schema';
import { CreateMeetingDto } from './dtos/createMeeting.dto';
import { Transcript } from './entities/transcript.entity';
import { TranscriptDocument } from './schemas/transcript.schema';
import { PaginatedMeetingsDto } from './dtos/paginatedMeetings.dto';

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

  async findAllUserMeetings(userId: string) {
    return await this.meetingModel
      .find({ owner: new Types.ObjectId(userId) })
      .sort({ scheduledAt: -1 });
  }

  async findUserMeetings(userId: string, input: PaginatedMeetingsDto) {
    const { pageNo, pageSize, search, scheduledFrom, scheduledTo, sortDateOrder, status } = input;

    const filter: QueryFilter<Meeting> = { owner: new Types.ObjectId(userId) };

    // Filtrez dupa titlu sau descriere

    const or: QueryFilter<Meeting>[] = [];
    if (search?.trim().length) or.push({ title: { $regex: escapeRegex(search), $options: 'i' } });
    if (search?.trim().length)
      or.push({ description: { $regex: escapeRegex(search), $options: 'i' } });

    if (or.length) filter.$or = or;

    if (status) filter.status = status;

    // Interval de filtrare dupa data
    if (scheduledFrom || scheduledTo) {
      filter.scheduledAt = {
        ...(scheduledFrom && { $gte: scheduledFrom }),
        ...(scheduledTo && { $lt: scheduledTo }),
      };
    }

    const sortByDateOrder = sortDateOrder?.toLowerCase() === 'newest first' ? -1 : 1;
    const [meetings, totalCount] = await Promise.all([
      this.meetingModel
        .find(filter)
        .sort({ scheduledAt: sortByDateOrder })
        .skip((pageNo - 1) * pageSize)
        .limit(pageSize),
      this.meetingModel.countDocuments(filter),
    ]);

    return { meetings, totalCount, pageNo, pageSize };
  }

  async findMeeting(userId: string, meetingId: string) {
    const meeting = await this.meetingModel.findOne({
      _id: new Types.ObjectId(meetingId),
      owner: new Types.ObjectId(userId),
    });
    if (!meeting) throw new NotFoundException('Meeting was not found');
    return meeting;
  }

  async createMeeting(userId: string, createMeetingDto: CreateMeetingDto) {
    const meeting = await this.meetingModel.create({
      owner: new Types.ObjectId(userId),
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
    await this.transcriptModel.deleteMany({ meetingId: new Types.ObjectId(meetingId) });
    // ! Update cu mai multe delete uri cand sunt mai multe colectii care referentiaza
    return meeting;
  }

  async findTranscriptByMeetingId(meetingId: string) {
    const transcript = await this.transcriptModel.findOne({
      meetingId: new Types.ObjectId(meetingId),
    });
    return transcript;
  }
}
