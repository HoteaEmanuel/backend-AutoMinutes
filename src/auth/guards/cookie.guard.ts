import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { TokenService } from '../token.service';
@Injectable()
export class CookieGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}
  async canActivate(context: ExecutionContext) {
    const req: Request = context.switchToHttp().getRequest();
    const cookie = req.headers.cookie;
    if (!cookie) throw new UnauthorizedException();
    console.log('COOKIE', cookie);
    const refreshToken = cookie?.split('=')[1];

    if (!refreshToken) throw new UnauthorizedException();

    console.log('REFRESH TOKEN :', refreshToken);
    return (await this.tokenService.verifyRefresh(refreshToken)) as boolean;
  }
}
