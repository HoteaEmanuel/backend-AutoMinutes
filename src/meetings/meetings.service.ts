import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Meeting, MeetingDocument } from './schemas/meetings.schema';
import { CreateMeetingDto } from './dto/createMeeting.dto';
import { Transcript } from './entities/transcript.entity';
import { TranscriptDocument } from './schemas/transcript.schema';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectModel(Meeting.name) private readonly meetingModel: Model<MeetingDocument>,
    @InjectModel(Transcript.name) private readonly transcriptModel: Model<TranscriptDocument>,
  ) {}

  async findAll() {
    return await this.meetingModel.find({}).sort({ scheduledAt: -1 });
  }

  async findUserMeetings(userId: string) {
    return await this.meetingModel.find({ owner: userId }).sort({ scheduledAt: -1 });
  }

  async findMeeting(userId: string, meetingId: string) {
    const meeting = await this.meetingModel.findOne({ _id: meetingId, owner: userId });
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
