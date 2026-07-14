import { TokenService } from './../token.service';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { type Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}
  async canActivate(context: ExecutionContext) {
    const request: Request = context.switchToHttp().getRequest();

    const authorization = request.headers.authorization;
    console.log('Authorization:', authorization);

    if (!authorization) throw new UnauthorizedException();

    // Bearer <token>

    const token = authorization.split(' ')[1]; // Luam tokenul

    if (!token) throw new UnauthorizedException();

    console.log('TOKEN SENT', token);

    try {
      const tokenPayload = (await this.tokenService.verifyAccess(token)) as {
        sub: string;
        email: string;
      };

      request.user = {
        userId: tokenPayload.sub,
        email: tokenPayload.email,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }
}
