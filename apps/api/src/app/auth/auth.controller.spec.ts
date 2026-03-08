import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { AuthSession } from './auth.types';

describe('AuthController', () => {
  let moduleRef: TestingModule;
  let controller: AuthController;

  const authServiceMock = {
    signUpEmail: jest.fn(),
    signInEmail: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = moduleRef.get<AuthController>(AuthController);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('handles successful sign-up', async () => {
      authServiceMock.signUpEmail.mockResolvedValue({
        token: 'token-1',
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'User',
          emailVerified: false,
          image: null,
        },
      });

      await expect(
        controller.signUp(
          {
            name: 'User',
            email: 'user@example.com',
            password: 'Password123!',
          },
          {},
        ),
      ).resolves.toEqual({
        token: 'token-1',
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'User',
          emailVerified: false,
          image: null,
        },
      });
    });

    it('rejects duplicate sign-up with deterministic error', async () => {
      authServiceMock.signUpEmail.mockRejectedValue(
        new ConflictException({
          errorCode: 'USER_ALREADY_EXISTS',
          message: 'An account with this email already exists.',
        }),
      );

      await expect(
        controller.signUp(
          {
            name: 'User',
            email: 'user@example.com',
            password: 'Password123!',
          },
          {},
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('signIn', () => {
    it('handles successful sign-in', async () => {
      authServiceMock.signInEmail.mockResolvedValue({
        token: 'token-2',
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'User',
          emailVerified: true,
          image: null,
        },
      });

      await expect(
        controller.signIn(
          {
            email: 'user@example.com',
            password: 'Password123!',
          },
          {},
        ),
      ).resolves.toEqual({
        token: 'token-2',
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'User',
          emailVerified: true,
          image: null,
        },
      });
    });

    it('denies invalid credentials', async () => {
      authServiceMock.signInEmail.mockRejectedValue(
        new UnauthorizedException('Invalid email or password.'),
      );

      await expect(
        controller.signIn(
          {
            email: 'user@example.com',
            password: 'wrong-password',
          },
          {},
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signOut', () => {
    it('invalidates session on sign-out', async () => {
      authServiceMock.signOut.mockResolvedValue({ success: true });

      await expect(controller.signOut({})).resolves.toEqual({ success: true });
    });
  });

  describe('getSession', () => {
    it('returns active session details', async () => {
      const session: AuthSession = {
        session: {
          id: 'session-1',
          userId: 'user-1',
          expiresAt: new Date('2030-01-01T00:00:00.000Z'),
          token: 'session-token',
          ipAddress: '127.0.0.1',
          userAgent: 'Jest',
        },
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'User',
          emailVerified: true,
          image: null,
        },
      };

      authServiceMock.getSession.mockResolvedValue(session);

      await expect(controller.getSession({})).resolves.toEqual(session);
    });
  });
});
