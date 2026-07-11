import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { UsersService } from '@users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { type Response } from 'express';
import { CurrentUser } from './decorator/current-user.decorator';
import { type AuthenticatedUser } from 'src/types/express';

@Controller('/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
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

  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.usersService.create(registerDto);
    const { accessToken, refreshToken } = await this.authService.createTokens(user);
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
  refresh() {}

  @Post('logout')
  @UseGuards(AuthGuard)
  logout() {}
}
