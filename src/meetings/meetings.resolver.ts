import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { MeetingsService } from './meetings.service';
import { Meeting } from './entities/meeting.entity';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import type { AuthenticatedUser } from 'src/types/express';
import { CreateMeetingDto } from './dtos/createMeeting.dto';
import { PaginatedMeetingsDto } from './dtos/paginatedMeetings.dto';
import { PaginatedMeetings } from './entities/paginatedMeetings.entity';
import { Transcript } from './entities/transcript.entity';

@Resolver(() => Meeting)
export class MeetingsResolver {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Query(() => [Meeting])
  async findAll() {
    return await this.meetingsService.findAll();
  }

  @Query(() => PaginatedMeetings)
  @UseGuards(AuthGuard)
  async findUserMeetings(
    @Args('input') paginatedInput: PaginatedMeetingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.meetingsService.findUserMeetings(user.userId, paginatedInput);
  }

  @Query(() => Meeting)
  @UseGuards(AuthGuard)
  async findMeeting(@Args('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return await this.meetingsService.findMeeting(user.userId, id);
  }

  @ResolveField(() => Transcript, { nullable: true })
  async findMeetingTranscript(@Args('meetingId') meetingId: string) {
    return await this.meetingsService.findTranscriptByMeetingId(meetingId);
  }

  @Query(() => Transcript, { nullable: true })
  async getTranscript(@Args('meetingId') meetingId: string) {
    return await this.meetingsService.findTranscriptByMeetingId(meetingId);
  }

  @Mutation(() => Meeting)
  @UseGuards(AuthGuard)
  async createMeeting(
    @Args('createMeetingInput') createMeetingDto: CreateMeetingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.meetingsService.createMeeting(user.userId, createMeetingDto);
  }

  @Mutation(() => Meeting)
  @UseGuards(AuthGuard)
  async deleteMeeting(@Args('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return await this.meetingsService.deleteMeeting(user.userId, id);
  }
}
