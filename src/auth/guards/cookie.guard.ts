import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { TokenService } from '../token.service';
@Injectable()
export class CookieGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}
  async canActivate(context: ExecutionContext) {
    const req: Request = context.switchToHttp().getRequest();
    const refreshToken = req.cookies?.refresh_token as string | undefined;

    if (!refreshToken) throw new UnauthorizedException();

    return (await this.tokenService.verifyRefresh(refreshToken)) as boolean;
  }
}
