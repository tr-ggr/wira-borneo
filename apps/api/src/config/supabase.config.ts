export interface SupabaseRuntimeConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  supabaseBucket: string;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy apps/api/.env.example and provide a valid value.`,
    );
  }

  return value;
}

export function getSupabaseRuntimeConfig(): SupabaseRuntimeConfig {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const supabaseServiceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseBucket = process.env.SUPABASE_BUCKET?.trim() || 'wira-borneo';

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
    supabaseBucket,
  };
}
