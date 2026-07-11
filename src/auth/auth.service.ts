import { UserDocument } from './../users/schemas/user.schema';
import { UsersService } from './../users/users.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { TokenService } from './token.service';
import { LoginDto } from './dto/login.dto';

type TokenPayload = {
  sub: string;
  email: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
  ) {}
  private static saltRounds = 12;

  async createAccessToken(payload: TokenPayload) {
    const accessToken = await this.tokenService.signAccess({
      email: payload.email,
      sub: payload.sub,
    });

    return accessToken;
  }

  async createTokens(user: UserDocument) {
    const refreshToken = await this.tokenService.signRefresh({ sub: user._id.toHexString() });
    const accessToken = await this.createAccessToken({
      sub: user._id.toHexString(),
      email: user.email,
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

    const passwordsMatch = await this.comparePasswords(loginDto.password, user.passwordHash);

    if (!passwordsMatch) throw new UnauthorizedException('Invalid credentials');

    try {
      const { refreshToken, accessToken } = await this.createTokens(user as UserDocument);

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

    return { accessToken };
  }
}
