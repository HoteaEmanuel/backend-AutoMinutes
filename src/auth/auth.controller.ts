import { GOOGLE_URL } from './../constants/auth';
import { CookieGuard } from './guards/cookie.guard';
import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { ResendVerificationDto } from './dtos/resend-verification.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import type { Response, Request } from 'express';
import { CurrentUser } from './decorator/current-user.decorator';
import { type AuthenticatedUser } from '../types/express';
import type { ConfigType } from '@nestjs/config';
import googleOauthConfig from './config/google-oauth.config';
@Controller('/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    @Inject(googleOauthConfig.KEY)
    private readonly googleConfig: ConfigType<typeof googleOauthConfig>,
  ) {}

  // Salvez refresh token ul intr un http only cookie
  saveCookie(refreshToken: string, res: Response) {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/auth',
      maxAge: 30 * 24 * 60 * 1000 * 60, // 30 zile
    });
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('signup')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.signup(registerDto);
  }

  @Post('verify-email')
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } = await this.authService.verifyEmail(verifyEmailDto);
    this.saveCookie(refreshToken, res);
    return { accessToken, user };
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('resend-verification')
  async resendVerification(@Body() resendVerificationDto: ResendVerificationDto) {
    return this.authService.resendVerification(resendVerificationDto.email);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.authenticate(loginDto);

    this.saveCookie(refreshToken, res);
    return { accessToken, user };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@CurrentUser() currentUser: AuthenticatedUser) {
    console.log('CURRENT USER ID: ', currentUser.userId);
    return this.usersService.findById(currentUser.userId);
  }

  @Post('refresh')
  @UseGuards(CookieGuard)
  async refresh(@Req() request: Request) {
    return await this.authService.refreshToken(request.cookies.refresh_token as string); // { accessToken }
  }

  @Get('google')
  redirectToGoogle(@Res() res: Response) {
    const { clientId, callbackUrl } = this.googleConfig;

    const params = new URLSearchParams({
      client_id: clientId!,
      redirect_uri: callbackUrl!,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });
    res.redirect(`${GOOGLE_URL}${params}`);
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    if (error || !code) throw new UnauthorizedException();
    const { refreshToken } = await this.authService.handleGoogleCallback(code);
    this.saveCookie(refreshToken, res);
    return res.redirect(`${process.env.FRONTEND_URL}/auth/oauth`);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token', {
      path: '/auth',
    });
    return {
      success: true,
    };
  }
}
