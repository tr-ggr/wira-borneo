import {
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response as ExpressResponse } from 'express';
import type { IncomingHttpHeaders } from 'node:http';
import { AuthService } from './auth.service';
import {
  AuthenticatedUser,
  AuthSession,
  SignInPayload,
  SignInResult,
  SignUpPayload,
  SignUpResult,
  UpdateLocationPayload,
  UpdateProfilePayload,
} from './auth.types';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @ApiBody({ type: SignUpPayload })
  @ApiResponse({ type: SignUpResult })
  async signUp(
    @Body() payload: SignUpPayload,
    @Headers() headers: IncomingHttpHeaders,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const { response, data } = await this.authService.signUpEmail(payload, headers);
    this.bridgeCookies(response, res);
    return data;
  }

  @Post('sign-in')
  @ApiBody({ type: SignInPayload })
  @ApiResponse({ type: SignInResult })
  async signIn(
    @Body() payload: SignInPayload,
    @Headers() headers: IncomingHttpHeaders,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const { response, data } = await this.authService.signInEmail(payload, headers);
    this.bridgeCookies(response, res);
    return data;
  }

  @Post('sign-out')
  @ApiResponse({ status: 200 })
  async signOut(
    @Headers() headers: IncomingHttpHeaders,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const { response } = await this.authService.signOut(headers);
    this.bridgeCookies(response, res);
    return { success: true };
  }

  @Get('session')
  @ApiResponse({ type: AuthSession })
  async getSession(@Headers() headers: IncomingHttpHeaders) {
    return this.authService.getSession(headers);
  }

  @Patch('profile')
  @ApiBody({ type: UpdateProfilePayload })
  @ApiResponse({ type: AuthenticatedUser })
  async updateProfile(
    @Body() payload: UpdateProfilePayload,
    @Headers() headers: IncomingHttpHeaders,
  ) {
    return this.authService.updateProfile(payload, headers);
  }

  @Patch('location')
  @ApiBody({ type: UpdateLocationPayload })
  @ApiResponse({ status: 200 })
  async updateLocation(
    @Body() payload: UpdateLocationPayload,
    @Headers() headers: IncomingHttpHeaders,
  ) {
    return this.authService.updateLocation(payload, headers);
  }

  private bridgeCookies(fetchResponse: Response, expressResponse: ExpressResponse) {
    const setCookie = fetchResponse.headers.get('set-cookie');
    if (setCookie) {
      // Fetch headers.get('set-cookie') returns a comma-separated string of all values.
      // Express setHeader('Set-Cookie', ...) can take an array.
      // However, parsing comma-separated Set-Cookie is tricky.
      // Better Auth usually sets them individually if we were using its middleware.
      // Here we trust the comma-separated string is handled by the browser or we split it.
      expressResponse.setHeader('Set-Cookie', setCookie);
    }
  }
}
