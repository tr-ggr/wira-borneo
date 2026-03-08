import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import type { AuthSession } from './auth.types';

export interface AuthenticatedRequest extends Request {
  authSession?: AuthSession;
}

@Injectable()
export class AuthSessionGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    const session = await this.authService.getSession(request.headers);

    if (!session) {
      throw new UnauthorizedException('Authentication is required.');
    }

    request.authSession = session;
    return true;
  }
}
