import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl)
);

// Keep the public-facing website renderable if deployment secrets have not been
// configured yet. Auth and database actions are explicitly disabled in that case.
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl! : 'https://configuration-missing.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey! : 'missing-public-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
