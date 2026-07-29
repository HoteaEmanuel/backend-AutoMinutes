import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, StrictCondition, Types } from 'mongoose';
import { Meeting, MeetingDocument } from './schemas/meetings.schema';
import { CreateMeetingDto } from './dtos/createMeeting.dto';
import { UpdateMeetingDto } from './dtos/updateMeeting.dto';
import { Transcript } from './entities/transcript.entity';
import { TranscriptDocument } from './schemas/transcript.schema';
import { PaginatedMeetingsDto } from './dtos/paginatedMeetings.dto';
import { UploadTranscriptDto } from './dtos/uploadTranscript.dto';
import { MeetingStatus } from './enums/meeting-status.enum';
import { ActionItem, ActionItemDocument } from 'src/action-items/schemas/actionItem.schema';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@Injectable()
export class MeetingsService {
  constructor(
    @InjectModel(Meeting.name) private readonly meetingModel: Model<MeetingDocument>,
    @InjectModel(Transcript.name) private readonly transcriptModel: Model<TranscriptDocument>,
    @InjectModel(ActionItem.name) private readonly actionItemModel: Model<ActionItemDocument>,
  ) {}

  async findAllUserMeetings(
    userId: string,
    range?: { scheduledFrom?: Date; scheduledTo?: Date },
  ) {
    const filter: QueryFilter<Meeting> = { owner: new Types.ObjectId(userId) };

    if (range?.scheduledFrom || range?.scheduledTo) {
      filter.scheduledAt = {
        ...(range.scheduledFrom && { $gte: range.scheduledFrom }),
        ...(range.scheduledTo && { $lt: range.scheduledTo }),
      };
    }

    return await this.meetingModel.find(filter).sort({ scheduledAt: -1 });
  }

  async findUserMeetings(userId: string, input: PaginatedMeetingsDto) {
    const {
      pageNo,
      pageSize,
      search,
      scheduledFrom,
      scheduledTo,
      sortDateOrder,
      status,
      hasTodos,
    } = input;

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

    // Doar meeting-urile care au cel putin un action item
    if (hasTodos) {
      const meetingIdsWithActionItems = await this.actionItemModel.distinct('meetingId');
      filter._id = { $in: meetingIdsWithActionItems };
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

  async updateMeeting(userId: string, updateMeetingDto: UpdateMeetingDto) {
    const { meetingId, title, description, scheduledAt } = updateMeetingDto;
    const meeting = await this.findMeeting(userId, meetingId);

    if (title !== undefined) meeting.title = title;
    if (description !== undefined) meeting.description = description;
    if (scheduledAt !== undefined) meeting.scheduledAt = scheduledAt;

    await meeting.save();
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
    const active = await this.transcriptModel.findOne({
      meetingId: new Types.ObjectId(meetingId),
      isActive: true,
    });
    if (active) return active;

    return await this.transcriptModel
      .findOne({ meetingId: new Types.ObjectId(meetingId) })
      .sort({ createdAt: -1 });
  }

  async findTranscriptVersions(meetingId: string) {
    return await this.transcriptModel
      .find({ meetingId: new Types.ObjectId(meetingId) })
      .sort({ createdAt: -1 });
  }

  async setTranscript(userId: string, uploadTranscriptDto: UploadTranscriptDto) {
    const { meetingId, content } = uploadTranscriptDto;
    await this.findMeeting(userId, meetingId);

    await this.transcriptModel.updateMany(
      { meetingId: new Types.ObjectId(meetingId) },
      { isActive: false },
    );

    return await this.transcriptModel.create({
      content,
      meetingId: new Types.ObjectId(meetingId),
      isActive: true,
    });
  }

  async selectTranscriptVersion(userId: string, transcriptId: string) {
    const transcript = await this.transcriptModel.findById(new Types.ObjectId(transcriptId));
    if (!transcript) throw new NotFoundException('Transcript version was not found');

    await this.findMeeting(userId, transcript.meetingId.toString());

    await this.transcriptModel.updateMany({ meetingId: transcript.meetingId }, { isActive: false });
    transcript.isActive = true;
    await transcript.save();
    return transcript;
  }

  async deleteAllUserMeetings(userId: string) {
    const meetings = await this.meetingModel.find(
      { owner: new Types.ObjectId(userId) },
      { _id: 1 },
    );
    const meetingIds = meetings.map((meeting) => meeting._id);
    await this.meetingModel.deleteMany({ _id: { $in: meetingIds } });
    await this.transcriptModel.deleteMany({ meetingId: { $in: meetingIds } });
    return meetingIds;
  }

  async updateStatus(meetingId: string, status: MeetingStatus) {
    await this.meetingModel.updateOne({ _id: new Types.ObjectId(meetingId) }, { $set: { status } });
  }
}
