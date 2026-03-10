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

  @ApiProperty({ required: false, nullable: true })
  age?: number | null;

  @ApiProperty({ required: false, nullable: true })
  housingType?: string | null;

  @ApiProperty({ required: false, nullable: true })
  personalInfo?: any | null;

  @ApiProperty({ required: false, nullable: true })
  vulnerabilities?: any | null;

  @ApiProperty({ required: false, nullable: true })
  householdComposition?: any | null;

  @ApiProperty({ required: false, nullable: true })
  emergencySkills?: any | null;

  @ApiProperty({ required: false, nullable: true })
  assets?: any | null;
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
