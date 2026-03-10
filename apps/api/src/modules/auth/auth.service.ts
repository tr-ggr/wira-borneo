import * as bcrypt from 'bcrypt';
import type { IncomingHttpHeaders } from 'node:http';
import { getAuthRuntimeConfig } from '../../config/auth.config';
import { PrismaService } from '../../core/database/database.service';
import {
  type AuthSession,
  type AuthenticatedUser,
  type SignInResult,
  type SignInPayload,
  type SignUpResult,
  type SignUpPayload,
} from './auth.types';
import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';

interface BetterAuthApi {
  signUpEmail: (input: { body: SignUpPayload; headers: Headers; asResponse?: boolean }) => Promise<any>;
  signInEmail: (input: { body: SignInPayload; headers: Headers; asResponse?: boolean }) => Promise<any>;
  signOut: (input: { headers: Headers; asResponse?: boolean }) => Promise<any>;
  getSession: (input: { headers: Headers }) => Promise<any>;
  admin: {
    listUsers: (input: { query: any; headers: Headers }) => Promise<any>;
    removeUser: (input: { body: { userId: string }; headers: Headers }) => Promise<any>;
    setRole: (input: { body: { userId: string; role: string }; headers: Headers }) => Promise<any>;
  };
}

interface BetterAuthRuntime {
  api: BetterAuthApi;
}

@Injectable()
export class AuthService {
  private authPromise: Promise<BetterAuthRuntime> | null = null;

  constructor(private readonly prisma: PrismaService) { }

  private async getAuth(): Promise<BetterAuthRuntime> {
    if (this.authPromise) {
      return this.authPromise;
    }

    this.authPromise = (async () => {
      const [{ betterAuth }, { prismaAdapter }, { admin }] = await Promise.all([
        import('better-auth'),
        import('better-auth/adapters/prisma'),
        import('better-auth/plugins'),
      ]);

      const config = getAuthRuntimeConfig();

      return betterAuth({
        database: prismaAdapter(this.prisma, { provider: 'postgresql' }),
        secret: config.authSecret,
        baseURL: config.authBaseUrl,
        trustedOrigins: config.trustedOrigins,
        emailAndPassword: {
          enabled: true,
          password: {
            hash: async (password) => {
              return await bcrypt.hash(password, 10);
            },
            verify: async ({ hash, password }) => {
              return await bcrypt.compare(password, hash);
            },
          },
        },
        plugins: [
          admin({
            adminUserIds: ['seed-user-admin'], // Initial admin ID from seed
          }),
        ],
      }) as BetterAuthRuntime;
    })();

    return this.authPromise;
  }

  private async toHeaders(headers: IncomingHttpHeaders): Promise<Headers> {
    const { fromNodeHeaders } = await import('better-auth/node');
    return fromNodeHeaders(headers);
  }

  async signUpEmail(
    payload: SignUpPayload,
    headers: IncomingHttpHeaders,
  ): Promise<{ response: Response; data: SignUpResult }> {
    try {
      const auth = await this.getAuth();
      const response = await auth.api.signUpEmail({
        body: {
          name: payload.name,
          email: payload.email,
          password: payload.password,
        },
        headers: await this.toHeaders(headers),
        asResponse: true,
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      return {
        response,
        data: {
          token: data.token,
          user: data.user ? this.toAuthenticatedUser(data.user) : null,
        },
      };
    } catch (error) {
      this.handleApiError(error, {
        duplicateErrorMessage: 'An account with this email already exists.',
      });
    }
  }

  async signInEmail(
    payload: SignInPayload,
    headers: IncomingHttpHeaders,
  ): Promise<{ response: Response; data: SignInResult }> {
    try {
      const auth = await this.getAuth();
      const response = await auth.api.signInEmail({
        body: {
          email: payload.email,
          password: payload.password,
        },
        headers: await this.toHeaders(headers),
        asResponse: true,
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      return {
        response,
        data: {
          token: data.token,
          user: data.user ? this.toAuthenticatedUser(data.user) : null,
        },
      };
    } catch (error) {
      this.handleApiError(error, {
        defaultUnauthorizedMessage: 'Invalid email or password.',
      });
    }
  }

  async signOut(headers: IncomingHttpHeaders): Promise<{ response: Response }> {
    try {
      const auth = await this.getAuth();
      const response = await auth.api.signOut({
        headers: await this.toHeaders(headers),
        asResponse: true,
      });
      return { response };
    } catch (error) {
      this.handleApiError(error, {
        defaultUnauthorizedMessage: 'You are not signed in.',
      });
    }
  }

  async getSession(headers: IncomingHttpHeaders): Promise<AuthSession | null> {
    try {
      const auth = await this.getAuth();
      const result = await auth.api.getSession({
        headers: await this.toHeaders(headers),
      });

      if (!result) {
        return null;
      }

      return {
        session: {
          id: result.session.id,
          userId: result.session.userId,
          expiresAt: result.session.expiresAt,
          token: result.session.token,
          ipAddress: result.session.ipAddress,
          userAgent: result.session.userAgent,
        },
        user: this.toAuthenticatedUser(result.user),
      };
    } catch (error) {
      this.handleApiError(error, {
        defaultUnauthorizedMessage: 'Session is invalid or expired.',
      });
    }
  }

  private toAuthenticatedUser(user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    image?: string | null;
    role?: string | null;
  }): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      image: user.image,
      role: user.role,
    };
  }

  private handleApiError(
    error: unknown,
    options?: {
      duplicateErrorMessage?: string;
      defaultUnauthorizedMessage?: string;
    },
  ): never {
    const apiError = error as {
      message?: string;
      status?: number;
      code?: string;
      error?: string | { message?: string; status?: number };
    };

    let message = apiError?.message || 'Authentication failed.';
    
    // Better Auth sometimes puts the message inside an 'error' object or field
    if (typeof apiError.error === 'string') {
      message = apiError.error;
    } else if (apiError.error?.message) {
      message = apiError.error.message;
    }

    const normalized = message.toLowerCase();

    if (
      normalized.includes('already exists') ||
      normalized.includes('duplicate') ||
      normalized.includes('unique constraint') ||
      apiError.code === 'USER_ALREADY_EXISTS'
    ) {
      throw new ConflictException({
        errorCode: 'USER_ALREADY_EXISTS',
        message: options?.duplicateErrorMessage ?? 'User already exists.',
      });
    }

    if (apiError?.status === 401 || apiError?.status === 403 || apiError.code === 'UNAUTHORIZED') {
      throw new UnauthorizedException(
        options?.defaultUnauthorizedMessage ?? message,
      );
    }

    if (apiError?.status === 400 || apiError?.status === 422) {
      throw new BadRequestException(message);
    }

    throw new BadRequestException(message);
  }
}
