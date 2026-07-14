import { UserDocument } from './../users/schemas/user.schema';
import { UsersService } from './../users/users.service';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcrypt';
import { TokenService } from './token.service';
import { LoginDto } from './dto/login.dto';
import googleOauthConfig from './config/google-oauth.config';

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
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) throw new UnauthorizedException();

    if (!user.passwordHash)
      throw new UnauthorizedException('This account used Google to sign in - Continue with Google');
    const passwordsMatch = await this.comparePasswords(loginDto.password, user.passwordHash);

    if (!passwordsMatch) throw new UnauthorizedException('Invalid credentials');

    try {
      const { refreshToken, accessToken } = await this.createTokens({
        sub: user._id.toHexString(),
        email: user.email,
      });

      return {
        accessToken,
        refreshToken,
        user,
      };
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }

  async refreshToken(refreshToken: string) {
    const tokenPayload = (await this.tokenService.verifyRefresh(refreshToken)) as {
      sub: string;
      email: string;
    };

    const accessToken = await this.createAccessToken(tokenPayload);

    const user = await this.usersService.findById(tokenPayload.sub);

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

    console.log('PAYLOAD: ', payload);

    const refreshToken = await this.createRefreshToken({ sub: user._id.toHexString() });
    return { refreshToken, user };
  }
}
