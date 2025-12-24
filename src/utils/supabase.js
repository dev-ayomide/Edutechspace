import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables!");
}

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey && supabaseUrl.startsWith('http'));

// IMPORTANT: Keep storageKey consistent - changing it breaks PKCE flow mid-auth
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storageKey: 'edutechspace-auth', // MUST keep this consistent
      storage: window.localStorage,
      flowType: 'pkce',
    },
  })
  : null;
