import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class TokenService {
  constructor(
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  signAccess(payload: { sub: string; email: string }) {
    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      expiresIn: this.config.getOrThrow('JWT_ACCESS_TTL'),
    });
  }

  signRefresh(payload: { sub: string }) {
    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      expiresIn: this.config.getOrThrow('JWT_REFRESH_TTL'),
    });
  }

  verifyAccess(token: string) {
    return this.jwt.verifyAsync(token, {
      secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
    });
  }

  verifyRefresh(token: string) {
    return this.jwt.verifyAsync(token, {
      secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
    });
  }
}
