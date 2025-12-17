import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are missing
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables!");
  console.error("Please create a .env.local file with:");
  console.error("VITE_SUPABASE_URL=your_supabase_url");
  console.error("VITE_SUPABASE_ANON_KEY=your_supabase_anon_key");
}

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey && supabaseUrl.startsWith('http'));

// Only create client if properly configured, otherwise create a dummy client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // We handle this manually in AuthCallback
      storageKey: 'edutechspace-auth',
      storage: window.localStorage,
      flowType: 'pkce', // More secure auth flow
      // Prevent aggressive session refresh that might cause issues
      debug: false,
    },
    global: {
      headers: {
        'x-application-name': 'edutechspace'
      }
    },
    db: {
      schema: 'public'
    },
    // Add retry logic for failed requests
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  })
  : null; // Return null if not configured - app will show setup instructions

