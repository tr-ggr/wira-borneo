import { UnauthorizedException } from '@nestjs/common';
import { AuthSessionGuard } from './auth-session.guard';
import { AuthService } from './auth.service';
import type { AuthSession } from './auth.types';

describe('AuthSessionGuard', () => {
  const authServiceMock: Pick<AuthService, 'getSession'> = {
    getSession: jest.fn(),
  };

  const guard = new AuthSessionGuard(authServiceMock as AuthService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('denies unauthenticated requests', async () => {
    (authServiceMock.getSession as jest.Mock).mockResolvedValue(null);

    const request = { headers: {} };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as never;

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('allows authenticated requests and attaches session context', async () => {
    const session: AuthSession = {
      session: {
        id: 'session-1',
        userId: 'user-1',
        expiresAt: new Date('2030-01-01T00:00:00.000Z'),
        token: 'token-1',
      },
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'User',
        emailVerified: true,
        image: null,
      },
    };

    (authServiceMock.getSession as jest.Mock).mockResolvedValue(session);

    const request: { headers: Record<string, string>; authSession?: AuthSession } =
      {
        headers: {},
      };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as never;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.authSession).toEqual(session);
  });
});
