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
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { UsersService } from '@users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { Response, Request } from 'express';
import { CurrentUser } from './decorator/current-user.decorator';
import { type AuthenticatedUser } from 'src/types/express';
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

  @Post('signup')
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.usersService.create(registerDto);
    const tokenData = { sub: user._id.toString(), email: user.email };
    const { accessToken, refreshToken } = await this.authService.createTokens(tokenData);
    this.saveCookie(refreshToken, res);
    return { accessToken, user };
  }

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
    console.log('BACK HERE');
    if (error || !code) throw new UnauthorizedException();
    const { refreshToken } = await this.authService.handleGoogleCallback(code);
    console.log('REFRESH FROM GOOGLE', refreshToken);
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
