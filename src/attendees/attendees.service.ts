import { deleteAttendeeDto } from './dtos/deleteAttendee.dto';
import { updateAttendeeDto } from './dtos/updateAttendee.dto';
import { Model, Types } from 'mongoose';
import { addAttendeeDto } from './dtos/addAttendee.dto';
import { Attendee, type AttendeeDocument } from './schemas/attendee.schema';
import { ConflictException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MeetingsService } from 'src/meetings/meetings.service';

@Injectable()
export class AttendeesService {
  constructor(
    @InjectModel(Attendee.name) private readonly attendeeModel: Model<AttendeeDocument>,
    private readonly meetingsService: MeetingsService,
  ) {}

  async createAttendee(ownerId: string, addAttendeeDto: addAttendeeDto) {
    try {
      const { meetingId, userId, ...rest } = addAttendeeDto;

      await this.meetingsService.findMeeting(ownerId, meetingId);

      if (addAttendeeDto.email) {
        const existingAttendeeWithEmail = await this.attendeeModel.findOne({
          email: addAttendeeDto.email,
          meetingId: new Types.ObjectId(meetingId),
        });
        if (existingAttendeeWithEmail)
          throw new ConflictException('Attendee with the same email already exists');
      }

      const newAttendee = await this.attendeeModel.create({
        ...rest,
        meetingId: new Types.ObjectId(meetingId),
        userId: userId ? new Types.ObjectId(userId) : undefined,
      });
      return newAttendee;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new Error();
    }
  }

  async updateAttendee(ownerId: string, updateAttendeeDto: updateAttendeeDto) {
    const { attendeeId, name, email, role } = updateAttendeeDto;

    const existingAttendee = await this.findAttendeeById(attendeeId);
    await this.meetingsService.findMeeting(ownerId, existingAttendee.meetingId.toString());

    if (email) {
      const existingAttendeeWithEmail = await this.attendeeModel.findOne({
        email,
        meetingId: existingAttendee.meetingId,
        _id: { $ne: existingAttendee._id },
      });
      if (existingAttendeeWithEmail)
        throw new ConflictException('Attendee with the same email already exists');
    }

    if (name !== undefined) existingAttendee.name = name;
    if (email !== undefined) existingAttendee.email = email;
    if (role !== undefined) existingAttendee.role = role;

    await existingAttendee.save();
    return existingAttendee;
  }

  async deleteAttendee(ownerId: string, deleteAttendeeDto: deleteAttendeeDto) {
    const existingAttendee = await this.findAttendeeById(deleteAttendeeDto.attendeeId);
    await this.meetingsService.findMeeting(ownerId, existingAttendee.meetingId.toString());

    await existingAttendee.deleteOne();
    return existingAttendee;
  }

  async findMeetingAttendees(ownerId: string, meetingId: string) {
    await this.meetingsService.findMeeting(ownerId, meetingId);
    return await this.attendeeModel.find({ meetingId: new Types.ObjectId(meetingId) });
  }

  async findOwnedAttendeeById(ownerId: string, attendeeId: string) {
    const attendee = await this.findAttendeeById(attendeeId);
    await this.meetingsService.findMeeting(ownerId, attendee.meetingId.toString());
    return attendee;
  }

  async findAttendeeById(attendeeId: string) {
    const attendee = await this.attendeeModel.findById(attendeeId);
    if (!attendee) throw new NotFoundException('Attendee not found');
    return attendee;
  }

  async findAttendeesByIds(attendeeIds: Types.ObjectId[]) {
    return await this.attendeeModel.find({ _id: { $in: attendeeIds } });
  }

  async findAttendeeByEmail(meetingId: string, email: string) {
    return await this.attendeeModel.findOne({
      email,
      meetingId: new Types.ObjectId(meetingId),
    });
  }

  async deleteAiGeneratedByMeetingId(meetingId: string, keepIds: Types.ObjectId[]) {
    await this.attendeeModel.deleteMany({
      meetingId: new Types.ObjectId(meetingId),
      aiGenerated: true,
      _id: { $nin: keepIds },
    });
  }

  async deleteByMeetingIds(meetingIds: Types.ObjectId[]) {
    await this.attendeeModel.deleteMany({ meetingId: { $in: meetingIds } });
  }
}
