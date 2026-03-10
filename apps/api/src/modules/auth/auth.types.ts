import { ApiProperty } from '@nestjs/swagger';

export class AuthenticatedUser {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  emailVerified!: boolean;

  @ApiProperty({ required: false, nullable: true })
  image?: string | null;

  @ApiProperty({ required: false, nullable: true })
  role?: string | null;
}

export class AuthSession {
  @ApiProperty()
  session!: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };

  @ApiProperty({ type: AuthenticatedUser })
  user!: AuthenticatedUser;
}

export class SignUpPayload {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  password!: string;
}

export class SignInPayload {
  @ApiProperty()
  email!: string;

  @ApiProperty()
  password!: string;
}

export class SignUpResult {
  @ApiProperty({ required: false, nullable: true })
  token!: string | null;

  @ApiProperty({ type: AuthenticatedUser })
  user!: AuthenticatedUser;
}

export class SignInResult {
  @ApiProperty()
  token!: string;

  @ApiProperty({ type: AuthenticatedUser })
  user!: AuthenticatedUser;
}
