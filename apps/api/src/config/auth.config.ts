export interface AuthRuntimeConfig {
  authSecret: string;
  authBaseUrl: string;
  trustedOrigins: string[];
}

const DEFAULT_LOCAL_TRUSTED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3192',
  'http://localhost:8888',
  'http://localhost:4444',
];

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy apps/api/.env.example and provide a valid value.`,
    );
  }

  return value;
}

function splitOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function getAuthRuntimeConfig(): AuthRuntimeConfig {
  const authSecret = requireEnv('AUTH_SECRET');
  const authBaseUrl = requireEnv('AUTH_BASE_URL');
  const trustedOriginsRaw = process.env.AUTH_TRUSTED_ORIGINS?.trim();
  const trustedOrigins = trustedOriginsRaw
    ? splitOrigins(trustedOriginsRaw)
    : DEFAULT_LOCAL_TRUSTED_ORIGINS;

  if (trustedOrigins.length === 0) {
    throw new Error(
      'AUTH_TRUSTED_ORIGINS must include at least one origin when provided.',
    );
  }

  return {
    authSecret,
    authBaseUrl,
    trustedOrigins,
  };
}
