import { deleteAttendeeDto } from './dtos/deleteAttendee.dto';
import { Model, Types } from 'mongoose';
import { addAttendeeDto } from './dtos/addAttendee.dto';
import { Attendee, type AttendeeDocument } from './schemas/attendee.schema';
import { ConflictException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class AttendeesService {
  constructor(
    @InjectModel(Attendee.name) private readonly attendeeModel: Model<AttendeeDocument>,
  ) {}

  async createAttendee(addAttendeeDto: addAttendeeDto) {
    try {
      const { meetingId, userId, ...rest } = addAttendeeDto;

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

  async deleteAttendee(deleteAttendeeDto: deleteAttendeeDto) {
    const existingAttendee = await this.attendeeModel.findById(deleteAttendeeDto.attendeeId);

    if (!existingAttendee) throw new NotFoundException('Attendee not found');

    await existingAttendee.deleteOne();
    return existingAttendee;
  }

  async findMeetingAttendees(meetingId: string) {
    return await this.attendeeModel.find({ meetingId: new Types.ObjectId(meetingId) });
  }

  async findAttendeeById(attendeeId: string) {
    const attendee = await this.attendeeModel.findById(attendeeId);
    if (!attendee) throw new NotFoundException('Attendee not found');
    return attendee;
  }

  async findAttendeesByIds(attendeeIds: Types.ObjectId[]) {
    return await this.attendeeModel.find({ _id: { $in: attendeeIds } });
  }

  async findAttendeeById(attendeeId: string) {
    const attendee = await this.attendeeModel.findById(attendeeId);
    if (!attendee) throw new NotFoundException('Attendee not found');
    return attendee;
  }
}
