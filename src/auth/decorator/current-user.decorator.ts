import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import type { Request } from 'express';
import { AuthenticatedUser } from 'src/types/express';

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser, ctx: ExecutionContext) => {
    const req: Request = getRequest(ctx);
    return data ? req.user?.[data] : req.user;
  },
);

// Folosesc REST + Graphql deci trebuie sa vad cum pot extrage requestul din context conform typeului
const getRequest = (context: ExecutionContext): Request => {
  if (context.getType<GqlContextType>() === 'graphql')
    return GqlExecutionContext.create(context).getContext().req! as Request;
  return context.switchToHttp().getRequest();
};
