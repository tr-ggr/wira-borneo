import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
} from '@nestjs/common';
import type { IncomingHttpHeaders } from 'node:http';
import { AuthService } from './auth.service';
import type { SignInPayload, SignUpPayload } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  async signUp(
    @Body() payload: SignUpPayload,
    @Headers() headers: IncomingHttpHeaders,
  ) {
    return this.authService.signUpEmail(payload, headers);
  }

  @Post('sign-in')
  async signIn(
    @Body() payload: SignInPayload,
    @Headers() headers: IncomingHttpHeaders,
  ) {
    return this.authService.signInEmail(payload, headers);
  }

  @Post('sign-out')
  async signOut(@Headers() headers: IncomingHttpHeaders) {
    return this.authService.signOut(headers);
  }

  @Get('session')
  async getSession(@Headers() headers: IncomingHttpHeaders) {
    return this.authService.getSession(headers);
  }
}
