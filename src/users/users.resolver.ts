import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { type AuthenticatedUser } from 'src/types/express';
import { UsersService } from './users.service';
import { R2Service } from './storage/r2.service';
import { User } from './entities/user.entity';
import { UpdateProfileInput } from './dtos/update-profile.input';
import { ChangePasswordInput } from './dtos/change-password.input';
import { SetPasswordInput } from './dtos/set-password.input';
import { MeetingsService } from 'src/meetings/meetings.service';
import { AttendeesService } from 'src/attendees/attendees.service';
import { ActionItemsService } from 'src/action-items/action-items.service';
import { AiService } from 'src/ai/ai.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly r2Service: R2Service,
    private readonly meetingsService: MeetingsService,
    private readonly attendeesService: AttendeesService,
    private readonly actionItemsService: ActionItemsService,
    private readonly aiService: AiService,
  ) {}

  @Query(() => User)
  @UseGuards(AuthGuard)
  me(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.findById(currentUser.userId);
  }

  @ResolveField(() => Boolean)
  hasPassword(@Parent() user: User) {
    return this.usersService.hasPassword(user.id);
  }

  @Mutation(() => User)
  @UseGuards(AuthGuard)
  updateProfile(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Args('input') input: UpdateProfileInput,
  ) {
    return this.usersService.update(currentUser.userId, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  changePassword(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Args('input') input: ChangePasswordInput,
  ) {
    return this.usersService.changePassword(
      currentUser.userId,
      input.currentPassword,
      input.newPassword,
    );
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  setPassword(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Args('input') input: SetPasswordInput,
  ) {
    return this.usersService.setPassword(currentUser.userId, input.newPassword);
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async deleteAccount(@CurrentUser() currentUser: AuthenticatedUser) {
    const user = await this.usersService.findById(currentUser.userId);

    const meetingIds = await this.meetingsService.deleteAllUserMeetings(currentUser.userId);
    await Promise.all([
      this.attendeesService.deleteByMeetingIds(meetingIds),
      this.actionItemsService.deleteByMeetingIds(meetingIds),
      this.aiService.deleteByMeetingIds(meetingIds),
    ]);

    const avatarKey = this.r2Service.keyFromUrl(user.avatar);
    if (avatarKey) await this.r2Service.delete(avatarKey);

    await this.usersService.remove(currentUser.userId);
    return true;
  }

  @Query(() => [User])
  @UseGuards(AuthGuard)
  users() {
    return this.usersService.findAll();
  }
}
