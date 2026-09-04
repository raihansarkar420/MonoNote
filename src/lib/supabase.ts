import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables with fallback to user's provided Supabase credentials
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://zlhrzeozucyobcrjrscv.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_Appvg2ltqE1WMl_4HUaxEg_s4VWWHAh';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon-key')
);

// Active Supabase client
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
