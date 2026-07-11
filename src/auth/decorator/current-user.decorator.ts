import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from 'src/types/express';

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser, ctx: ExecutionContext) => {
    const req: Request = ctx.switchToHttp().getRequest();
    return data ? req.user?.[data] : req.user;
  },
);
