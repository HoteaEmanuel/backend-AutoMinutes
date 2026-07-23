import { PaginatedMeetings } from './../meetings/entities/paginatedMeetings.entity';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AttendeesService } from './attendees.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Attendee } from './entities/attendee.entity';
import { addAttendeeDto } from './dtos/addAttendee.dto';
import { deleteAttendeeDto } from './dtos/deleteAttendee.dto';

@Resolver()
@UseGuards(AuthGuard)
export class AttendeesResolver {
  constructor(private readonly attendeesService: AttendeesService) {}

  @Mutation(() => Attendee)
  addAttendee(@Args('addAttendeeDto') addAttendeeDto: addAttendeeDto) {
    return this.attendeesService.createAttendee(addAttendeeDto);
  }

  @Mutation(() => Attendee)
  deleteAttendee(@Args('deleteAttendeeDto') deleteAttendeeDto: deleteAttendeeDto) {
    return this.attendeesService.deleteAttendee(deleteAttendeeDto);
  }

  @Query(() => [Attendee])
  getAttendees(@Args('meetingId') meetingId: string) {
    return this.attendeesService.findMeetingAttendees(meetingId);
  }

  @Query(() => Attendee)
  findById(@Args('attendeeId') attendeeId: string) {
    return this.attendeesService.findAttendeeById(attendeeId);
  }
}
