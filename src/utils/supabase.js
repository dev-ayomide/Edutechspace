import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables!");
}

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey && supabaseUrl.startsWith('http'));

// Create the Supabase client with PKCE flow configuration
// Note: detectSessionInUrl is set to false to prevent race conditions
// We handle the OAuth callback manually in AuthCallback.jsx
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      // Set to false - we handle the code exchange manually in AuthCallback
      // This prevents race conditions with React's component lifecycle
      detectSessionInUrl: false,
      storage: window.localStorage,
      // Use PKCE flow for better security (default for SPAs)
      flowType: 'pkce',
    },
  })
  : null;

// Helper to exchange OAuth code for session
// Must be called on the callback page to complete the OAuth flow
export const handleOAuthCallback = async () => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  
  if (!code) {
    console.log('🔐 handleOAuthCallback: No code in URL');
    // No code in URL, check for existing session
    return supabase.auth.getSession();
  }
  
  console.log('🔐 handleOAuthCallback: Found code in URL, exchanging...');
  
  try {
    // Exchange the authorization code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('🔐 handleOAuthCallback: Exchange failed:', error.message);
      
      // Check if the code was already exchanged (e.g., page refresh)
      if (error.message.includes('already') || error.message.includes('invalid') || error.message.includes('expired')) {
        console.log('🔐 handleOAuthCallback: Code may have been used, checking session...');
        const sessionResult = await supabase.auth.getSession();
        if (sessionResult.data?.session) {
          console.log('🔐 handleOAuthCallback: Found existing session');
          return { data: { session: sessionResult.data.session }, error: null };
        }
      }
      
      return { data: null, error };
    }
    
    console.log('✅ handleOAuthCallback: Exchange successful!', data.session?.user?.email);
    return { data, error: null };
  } catch (err) {
    console.error('🔐 handleOAuthCallback: Exception:', err);
    return { data: null, error: err };
  }
};
