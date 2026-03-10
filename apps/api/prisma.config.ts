import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema',
  migrations: {
    path: 'prisma/migrations',
    // Run seed through a wrapper so Prisma CLI extra args do not interfere with tsc -p.
    seed: 'node scripts/run-prisma-seed.mjs',
  },
  datasource: {
    // Use direct connection for migrations/seed (required for Supabase pooler). Fallback to DATABASE_URL for local dev.
    url: process.env.DIRECT_URL || env('DATABASE_URL'),
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
