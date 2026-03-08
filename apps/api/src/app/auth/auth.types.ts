export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image?: string | null;
}

export interface AuthSession {
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
  user: AuthenticatedUser;
}

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpResult {
  token: string | null;
  user: AuthenticatedUser;
}

export interface SignInResult {
  token: string;
  user: AuthenticatedUser;
}
