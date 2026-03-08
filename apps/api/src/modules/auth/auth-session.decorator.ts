import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthSession } from './auth.types';
import type { AuthenticatedRequest } from './auth-session.guard';

export const AuthSessionParam = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthSession => {
    const request = ctx
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    return request.authSession as AuthSession;
  },
);
