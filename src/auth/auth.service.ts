import { UsersService } from './../users/users.service';
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcrypt';
import { TokenService } from './token.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import googleOauthConfig from './config/google-oauth.config';
import { EmailVerificationService } from '../email-verification/email-verification.service';
import { PasswordResetService } from '../password-reset/password-reset.service';

type tokenCreationProps = {
  sub: string;
  email: string;
};

type refreshTokenProps = Pick<tokenCreationProps, 'sub'>;

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly passwordResetService: PasswordResetService,
    @Inject(googleOauthConfig.KEY)
    private readonly googleConfig: ConfigType<typeof googleOauthConfig>,
  ) {
    this.googleClient = new OAuth2Client({
      clientId: googleConfig.clientId,
      clientSecret: googleConfig.clientSecret,
      redirectUri: googleConfig.callbackUrl,
    });
  }
  private static saltRounds = 12;

  async createAccessToken(payload: tokenCreationProps) {
    const accessToken = await this.tokenService.signAccess({
      email: payload.email,
      sub: payload.sub,
    });

    return accessToken;
  }

  async createRefreshToken(payload: refreshTokenProps) {
    const refreshToken = await this.tokenService.signRefresh({
      sub: payload.sub,
    });

    return refreshToken;
  }

  async createTokens(payload: tokenCreationProps) {
    const refreshToken = await this.createRefreshToken({ sub: payload.sub });
    const accessToken = await this.createAccessToken({
      ...payload,
    });
    return { accessToken, refreshToken };
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(AuthService.saltRounds);
    return bcrypt.hash(password, salt);
  }

  async comparePasswords(password: string, hashedPassword: string) {
    return await bcrypt.compare(password, hashedPassword);
  }

  async authenticate(loginDto: LoginDto) {
    const user = await this.usersService.findByEmailOrNull(loginDto.email);
    if (!user) throw new UnauthorizedException('Invalid email or password');

    if (!user.passwordHash) throw new UnauthorizedException('Invalid email or password');
    const passwordsMatch = await this.comparePasswords(loginDto.password, user.passwordHash);

    if (!passwordsMatch) throw new UnauthorizedException('Invalid email or password');

    if (!user.emailVerified) {
      throw new ForbiddenException({
        message: 'Please verify your email before logging in. Check your inbox for the code.',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
      });
    }

    try {
      const { refreshToken, accessToken } = await this.createTokens({
        sub: user._id.toHexString(),
        email: user.email,
      });
      user.passwordHash = undefined;
      return {
        accessToken,
        refreshToken,
        user,
      };
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }

  async signup(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmailOrNull(registerDto.email);

    if (existingUser) {
      try {
        if (!existingUser.emailVerified) {
          await this.emailVerificationService.resendCode({
            userId: existingUser._id,
            email: existingUser.email,
            firstName: existingUser.firstName,
          });
        } else {
          await this.emailVerificationService.notifyExistingAccount(
            existingUser.email,
            existingUser.firstName,
          );
        }
      } catch (error) {
        if (!this.isRateLimitError(error)) throw error;
      }
      return { email: registerDto.email };
    }

    const user = await this.usersService.create(registerDto);
    await this.emailVerificationService.issueCode({
      userId: user._id,
      email: user.email,
      firstName: user.firstName,
    });

    return { email: user.email };
  }

  private isRateLimitError(error: unknown): boolean {
    const response = error instanceof HttpException ? error.getResponse() : null;
    const code =
      typeof response === 'object' && response ? (response as { code?: string }).code : null;
    return code === 'RESEND_COOLDOWN' || code === 'RESEND_LIMIT';
  }

  async verifyEmail({ email, code }: VerifyEmailDto) {
    const user = await this.usersService.findByEmailOrNull(email);
    if (!user || user.emailVerified) throw new BadRequestException('Invalid or expired code.');

    await this.emailVerificationService.consumeCode(user._id, code);
    const verified = await this.usersService.markEmailVerified(user._id);

    const { accessToken, refreshToken } = await this.createTokens({
      sub: verified._id.toHexString(),
      email: verified.email,
    });
    return { accessToken, refreshToken, user: verified };
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findByEmailOrNull(email);

    if (user && !user.emailVerified) {
      try {
        await this.emailVerificationService.resendCode({
          userId: user._id,
          email: user.email,
          firstName: user.firstName,
        });
      } catch (error) {
        if (!this.isRateLimitError(error)) throw error;
      }
    }

    return { email };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmailOrNull(email);
    if (user) {
      try {
        if (user.passwordHash) {
          await this.passwordResetService.requestReset({
            userId: user._id,
            email: user.email,
            firstName: user.firstName,
          });
        } else {
          await this.passwordResetService.notifyGoogleOnlyAccount(user.email, user.firstName);
        }
      } catch (error) {
        if (!this.isRateLimitError(error)) throw error;
      }
    }

    return {
      message:
        'If an account with that email address exists, you will receive an email at that address in a few minutes with further instructions.',
    };
  }

  async resetPassword({ token, newPassword }: ResetPasswordDto) {
    const userId = await this.passwordResetService.consumeToken(token);
    const passwordHash = await this.hashPassword(newPassword);
    await this.usersService.setPasswordHash(userId, passwordHash);
    return { success: true };
  }

  async refreshToken(refreshToken: string) {
    const tokenPayload = (await this.tokenService.verifyRefresh(refreshToken)) as {
      sub: string;
    };

    const user = await this.usersService.findById(tokenPayload.sub);

    const accessToken = await this.createAccessToken({ sub: tokenPayload.sub, email: user.email });

    return { accessToken, user };
  }

  async handleGoogleCallback(code: string) {
    const { tokens } = await this.googleClient.getToken(code);
    if (!tokens.id_token) throw new UnauthorizedException('No id_token returned');

    const ticket = await this.googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: this.googleConfig.clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified)
      throw new UnauthorizedException('Google account has no verified email');

    const user = await this.usersService.findOrCreateGoogleUser({
      email: payload.email,
      firstName: payload.given_name ?? '',
      lastName: payload.family_name ?? '',
      avatar: payload.picture,
    });

    const refreshToken = await this.createRefreshToken({ sub: user._id.toHexString() });
    return { refreshToken, user };
  }
}
