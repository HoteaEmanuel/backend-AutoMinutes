import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AttendeesService } from './attendees.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Attendee } from './entities/attendee.entity';
import { addAttendeeDto } from './dtos/addAttendee.dto';
import { deleteAttendeeDto } from './dtos/deleteAttendee.dto';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import type { AuthenticatedUser } from 'src/types/express';

@Resolver()
@UseGuards(AuthGuard)
export class AttendeesResolver {
  constructor(private readonly attendeesService: AttendeesService) {}

  @Mutation(() => Attendee)
  addAttendee(
    @Args('addAttendeeDto') addAttendeeDto: addAttendeeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendeesService.createAttendee(user.userId, addAttendeeDto);
  }

  @Mutation(() => Attendee)
  deleteAttendee(
    @Args('deleteAttendeeDto') deleteAttendeeDto: deleteAttendeeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendeesService.deleteAttendee(user.userId, deleteAttendeeDto);
  }

  @Query(() => [Attendee])
  getAttendees(@Args('meetingId') meetingId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.attendeesService.findMeetingAttendees(user.userId, meetingId);
  }

  @Query(() => Attendee)
  findById(@Args('attendeeId') attendeeId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.attendeesService.findOwnedAttendeeById(user.userId, attendeeId);
  }
}
