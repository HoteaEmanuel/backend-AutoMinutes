import { TokenService } from './../token.service';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { type Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}
  async canActivate(context: ExecutionContext) {
    const request: Request = this.getRequest(context);

    const authorization = request.headers.authorization;

    if (!authorization) throw new UnauthorizedException();

    // Bearer <token>

    const token = authorization.split(' ')[1]; // Luam tokenul

    if (!token) throw new UnauthorizedException();

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

  // Folosesc REST + Graphql deci trebuie sa vad cum pot extrage requestul din context conform typeului
  getRequest(context: ExecutionContext): Request {
    if (context.getType<GqlContextType>() === 'graphql')
      return GqlExecutionContext.create(context).getContext().req! as Request;
    return context.switchToHttp().getRequest();
  }
}
