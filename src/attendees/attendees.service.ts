import { deleteAttendeeDto } from './dtos/deleteAttendee.dto';
import { Model } from 'mongoose';
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
      if (addAttendeeDto.email) {
        const existingAttendeeWithEmail = await this.attendeeModel.findOne({
          email: addAttendeeDto.email,
          meetingId: addAttendeeDto.meetingId,
        });
        if (existingAttendeeWithEmail)
          throw new ConflictException('Attendee with the same email already exists');
      }

      const newAttendee = await this.attendeeModel.create({ ...addAttendeeDto });
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
    return await this.attendeeModel.find({ meetingId });
  }
}
