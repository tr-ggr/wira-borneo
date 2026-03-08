import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthSessionParam } from './auth/auth-session.decorator';
import { AuthSessionGuard } from './auth/auth-session.guard';
import type { AuthSession } from './auth/auth.types';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getData() {
    return this.appService.getData();
  }

  @Get('protected')
  @UseGuards(AuthSessionGuard)
  async getProtectedData(@AuthSessionParam() authSession: AuthSession) {
    return {
      message: `Hello ${authSession.user.name}`,
      userId: authSession.user.id,
      authenticated: true,
    };
  }
}
