import { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { supabase, isSupabaseConfigured } from '../utils/supabase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const isSyncingUser = useRef(false);
  const isInitialized = useRef(false);

  // Stable navigation function that doesn't cause re-renders
  const navigateToLogin = useCallback(() => {
    // Use window.location for navigation to avoid React Router issues
    if (window.location.pathname !== '/login' && window.location.pathname !== '/admin/login') {
      window.location.href = '/login';
    }
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network: Back online');
      setIsOnline(true);
      toast.info('Connection restored');
    };

    const handleOffline = () => {
      console.log('Network: Offline');
      setIsOnline(false);
      toast.warning('No internet connection');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabase) {
      console.error('Supabase is not configured. Please set environment variables.');
      setLoading(false);
      setIsInitializing(false);
      return;
    }

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');

        // Get the current session from storage (this is critical for page refreshes)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          setLoading(false);
          setIsInitializing(false);
          return;
        }

        if (session?.user) {
          console.log('✅ Found existing session on refresh');
          // Set initializing to false IMMEDIATELY so App can render
          // Don't wait for syncUser - let it happen in background
          setIsInitializing(false);
          
          // Set basic user state immediately so app knows user is authenticated
          setUser({ id: session.user.id, email: session.user.email });
          setIsAuthenticated(true);
          setLoading(false);
          
          // Sync user data in background (don't block rendering)
          if (!isSyncingUser.current) {
            isSyncingUser.current = true;
            syncUser(session.user).catch(err => {
              console.error('Sync user error on init (background):', err);
              // Don't update state here - already set above
            }).finally(() => {
              isSyncingUser.current = false;
            });
          }
        } else {
          console.log('ℹ️ No existing session found');
          setLoading(false);
          setIsInitializing(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setLoading(false);
        setIsInitializing(false);
      }
    };

    initializeAuth();

    // Listen for Supabase auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event);

      // Handle different auth events
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ User signed in');
        setIsInitializing(false); // Ensure initialization is complete
        if (!isSyncingUser.current) {
          isSyncingUser.current = true;
          try {
            await syncUser(session.user);
          } catch (err) {
            console.error('Sync user error on sign in:', err);
            // Keep user logged in even if sync fails
            setUser({ id: session.user.id, email: session.user.email });
            setIsAuthenticated(true);
            setLoading(false);
          } finally {
            isSyncingUser.current = false;
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 User signed out');
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        // Only navigate if not already on login page
        if (window.location.pathname !== '/login' && window.location.pathname !== '/admin/login') {
          navigateToLogin();
        }
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed successfully');
        // Don't clear user state on token refresh - this is critical!
        // The session is still valid, just the token was refreshed
        if (session?.user && !user) {
          // Only sync if we don't have user data
          if (!isSyncingUser.current) {
            isSyncingUser.current = true;
            try {
              await syncUser(session.user);
            } catch (err) {
              console.error('Sync user error on token refresh:', err);
            } finally {
              isSyncingUser.current = false;
            }
          }
        }
      } else if (event === 'USER_UPDATED') {
        console.log('👤 User updated');
        if (session?.user && !isSyncingUser.current) {
          isSyncingUser.current = true;
          try {
            await syncUser(session.user);
          } catch (err) {
            console.error('Sync user error on update:', err);
          } finally {
            isSyncingUser.current = false;
          }
        }
      } else if (event === 'INITIAL_SESSION') {
        console.log('🎬 Initial session detected');
        setIsInitializing(false); // Ensure initialization is complete
        // This event fires when auth is initialized with an existing session
        if (session?.user && !user) {
          if (!isSyncingUser.current) {
            isSyncingUser.current = true;
            try {
              await syncUser(session.user);
            } catch (err) {
              console.error('Sync user error on initial session:', err);
              setUser({ id: session.user.id, email: session.user.email });
              setIsAuthenticated(true);
              setLoading(false);
            } finally {
              isSyncingUser.current = false;
            }
          }
        }
      }
    });

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigateToLogin]);

  const syncUser = async (supabaseUser, retryCount = 0) => {
    const maxRetries = 2;

    try {
      // Check network connectivity first
      if (!navigator.onLine) {
        throw new Error('No internet connection');
      }

      // Check if user exists in our users table
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('id, name, email, picture, ongoingcourses, completedcourses, phone, role')
        .eq('id', supabaseUser.id)
        .single();

      let userData;

      if (selectError && selectError.code !== 'PGRST116') {
        throw new Error(selectError.message);
      }

      if (existingUser) {
        // IMPORTANT: Always fetch fresh role from database (don't update it)
        // This ensures role changes in DB are reflected immediately
        const { data: refreshedUser, error: refreshError } = await supabase
          .from('users')
          .select('id, name, email, picture, ongoingcourses, completedcourses, phone, role')
          .eq('id', existingUser.id)
          .single();

        if (refreshError) {
          throw new Error(refreshError.message);
        }

        // Update user with latest info from auth metadata (but preserve role from DB)
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            name: supabaseUser.user_metadata?.name || refreshedUser.name,
            picture: supabaseUser.user_metadata?.picture || refreshedUser.picture,
            phone: supabaseUser.user_metadata?.phone || refreshedUser.phone,
            // DO NOT update role - keep it from database
            role: refreshedUser.role || 'user',
          })
          .eq('id', existingUser.id)
          .select('id, name, email, picture, ongoingcourses, completedcourses, phone, role')
          .single();

        if (updateError) {
          throw new Error(updateError.message);
        }

        userData = updatedUser;
      } else {
        // Create new user record
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: supabaseUser.id,
            name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
            email: supabaseUser.email,
            picture: supabaseUser.user_metadata?.picture || null,
            phone: supabaseUser.user_metadata?.phone || null,
            ongoingcourses: 0,
            completedcourses: 0,
            role: 'user',
          })
          .select('id, name, email, picture, ongoingcourses, completedcourses, phone, role')
          .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        userData = newUser;
      }

      // Set user state with fresh data
      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);

      // Debug log in development
      if (import.meta.env.DEV) {
        console.log('✅ User synced:', {
          email: userData.email,
          role: userData.role,
          isAdmin: userData.role === 'admin'
        });
      }

    } catch (err) {
      console.error('❌ Sync user error:', err);

      // Retry logic for network errors
      if (retryCount < maxRetries && (err.message?.includes('Failed to fetch') || err.message?.includes('network') || !navigator.onLine)) {
        console.log(`Retrying sync (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return syncUser(supabaseUser, retryCount + 1);
      }

      // Show user-friendly error messages
      if (!navigator.onLine || err.message?.includes('No internet connection')) {
        toast.error('No internet connection. Please check your network.');
      } else if (err.message && !err.message.includes('row-level security')) {
        toast.error('Failed to sync user account. Please refresh the page.');
      }

      setLoading(false);
      // For critical errors, sign out the user
      if (err.message?.includes('JWT') || err.message?.includes('token')) {
        await supabase.auth.signOut();
      }
      // Don't throw - allow app to continue
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Wait for user sync with timeout
      if (data.session && data.user) {
        try {
          // Sync user data immediately for faster login
          await syncUser(data.user);
          toast.success('Logged in successfully!');
          // Navigation will be handled by Login component
        } catch (syncErr) {
          console.error('Initial sync failed, will retry:', syncErr);
          // Don't fail login if sync fails - auth state listener will retry
        }
      }

    } catch (err) {
      setLoading(false);
      // Check if it's a network error
      if (!navigator.onLine) {
        toast.error('No internet connection. Please check your network and try again.');
      } else if (err.message?.includes('Invalid login credentials')) {
        toast.error('Invalid email or password.');
      } else if (err.message?.includes('Email not confirmed')) {
        toast.error('Please confirm your email before logging in.');
      } else {
        toast.error(err.message || 'Failed to log in. Please try again.');
      }
      throw err;
    }
  };

  const signup = async (name, email, password, phone = '') => {
    try {
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
          },
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (error) {
        throw error;
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        toast.info('Please check your email to confirm your account.');
        window.location.href = '/login';
        return;
      }

      // If session is created immediately (email confirmation disabled)
      // syncUser will be called by onAuthStateChange listener
      toast.success('Account created successfully!');

    } catch (err) {
      const errorMsg = err.message || 'Failed to sign up';
      toast.error(errorMsg);
      throw err;
    }
  };

  const googleLogin = async (redirectTo = '/course') => {
    try {
      const baseUrl = window.location.origin;
      const callbackUrl = `${baseUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}`;

      // Store redirect destination in localStorage as backup
      localStorage.setItem('oauth_redirect', redirectTo);

      console.log('🔐 Google OAuth - Starting', { callbackUrl, redirectTo });

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          // Request offline access to get refresh token from Google
          // This ensures we get provider tokens we can use if needed
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('❌ Google OAuth error:', error);
        throw new Error(error.message || 'Google sign-in failed');
      }

      // signInWithOAuth automatically redirects to Google
      // After Google auth, user is redirected back to /auth/callback
    } catch (err) {
      console.error('❌ Google login error:', err);
      toast.error(err.message || 'Failed to sign in with Google');
      throw err;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully!');

      // Use window.location to avoid React Router navigation issues
      window.location.href = '/';

    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Failed to log out');
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = '/';
    }
  };

  const fetchProfile = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('No active session');
      }

      // Always fetch fresh data from database (especially role)
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, name, email, picture, ongoingcourses, completedcourses, phone, role')
        .eq('id', session.user.id)
        .single();

      if (error) {
        throw error;
      }

      // Update state with fresh data
      setUser(userData);
      setIsAuthenticated(true);

      // Debug log in development
      if (import.meta.env.DEV) {
        console.log('✅ Profile fetched:', {
          email: userData.email,
          role: userData.role,
          isAdmin: userData.role === 'admin'
        });
      }

      return userData;

    } catch (err) {
      console.error('❌ Fetch profile error:', err);
      toast.error('Failed to fetch profile');
      setIsAuthenticated(false);
      setUser(null);
      throw err;
    }
  };

  const deleteAccount = async () => {
    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('No active session');
      }

      // Delete user record from users table
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', session.user.id);

      if (deleteError) {
        throw deleteError;
      }

      // Delete auth user (this requires admin privileges or RLS policies)
      // Note: You might need to call a backend endpoint or use Supabase Admin API
      await supabase.auth.signOut();

      setUser(null);
      setIsAuthenticated(false);
      window.location.href = '/';
      toast.success('Account deleted successfully!');

    } catch (err) {
      toast.error('Failed to delete account');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = () => {
    const adminCheck = user?.role === 'admin';

    // Debug log in development
    if (import.meta.env.DEV) {
      console.log('🔐 Admin check:', {
        hasUser: !!user,
        userEmail: user?.email,
        userRole: user?.role,
        isAdmin: adminCheck
      });
    }

    return adminCheck;
  };

  const contextValue = {
    user,
    isAuthenticated,
    loading,
    isInitializing,
    isOnline,
    signup,
    login,
    logout,
    googleLogin,
    fetchProfile,
    deleteAccount,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};