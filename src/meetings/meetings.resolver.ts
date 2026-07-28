import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { MeetingsService } from './meetings.service';
import { Meeting } from './entities/meeting.entity';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import type { AuthenticatedUser } from 'src/types/express';
import { CreateMeetingDto } from './dtos/createMeeting.dto';
import { UpdateMeetingDto } from './dtos/updateMeeting.dto';
import { PaginatedMeetingsDto } from './dtos/paginatedMeetings.dto';
import { UploadTranscriptDto } from './dtos/uploadTranscript.dto';
import { PaginatedMeetings } from './entities/paginatedMeetings.entity';
import { Transcript } from './entities/transcript.entity';

@Resolver(() => Meeting)
export class MeetingsResolver {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Query(() => PaginatedMeetings)
  @UseGuards(AuthGuard)
  async findUserMeetings(
    @Args('input') paginatedInput: PaginatedMeetingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.meetingsService.findUserMeetings(user.userId, paginatedInput);
  }

  @Query(() => [Meeting])
  @UseGuards(AuthGuard)
  async getUserMeetings(@CurrentUser() user: AuthenticatedUser) {
    return await this.meetingsService.findAllUserMeetings(user.userId);
  }

  @Query(() => Meeting)
  @UseGuards(AuthGuard)
  async findMeeting(@Args('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return await this.meetingsService.findMeeting(user.userId, id);
  }

  @ResolveField(() => Transcript, { nullable: true })
  @UseGuards(AuthGuard)
  async findMeetingTranscript(
    @Args('meetingId') meetingId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.meetingsService.findMeeting(user.userId, meetingId);
    return await this.meetingsService.findTranscriptByMeetingId(meetingId);
  }

  @Query(() => Transcript, { nullable: true })
  @UseGuards(AuthGuard)
  async getTranscript(
    @Args('meetingId') meetingId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.meetingsService.findMeeting(user.userId, meetingId);
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
  async updateMeeting(
    @Args('updateMeetingInput') updateMeetingDto: UpdateMeetingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.meetingsService.updateMeeting(user.userId, updateMeetingDto);
  }

  @Mutation(() => Meeting)
  @UseGuards(AuthGuard)
  async deleteMeeting(@Args('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return await this.meetingsService.deleteMeeting(user.userId, id);
  }

  @Mutation(() => Transcript)
  @UseGuards(AuthGuard)
  async uploadTranscript(
    @Args('uploadTranscriptDto') uploadTranscriptDto: UploadTranscriptDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.meetingsService.setTranscript(user.userId, uploadTranscriptDto);
  }
}
