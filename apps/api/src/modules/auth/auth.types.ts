import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { AgeGroup } from '../../generated/prisma/enums';

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
  pregnantStatus?: boolean | null;

  @ApiProperty({ required: false, nullable: true, enum: AgeGroup })
  ageGroup?: AgeGroup | null;

  @ApiProperty({ required: false, nullable: true })
  isPWD?: boolean | null;
}

export class UpdateProfilePayload {
  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsBoolean()
  pregnantStatus?: boolean | null;

  @ApiProperty({ required: false, nullable: true, enum: AgeGroup })
  @IsOptional()
  @IsEnum(AgeGroup)
  ageGroup?: AgeGroup | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsBoolean()
  isPWD?: boolean | null;
}

export class UpdateLocationPayload {
  @ApiProperty()
  @IsNumber()
  latitude!: number;

  @ApiProperty()
  @IsNumber()
  longitude!: number;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  region?: string | null;
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

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsBoolean()
  pregnantStatus?: boolean | null;

  @ApiProperty({ required: false, nullable: true, enum: AgeGroup })
  @IsOptional()
  @IsEnum(AgeGroup)
  ageGroup?: AgeGroup | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsBoolean()
  isPWD?: boolean | null;
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
