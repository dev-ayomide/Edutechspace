import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { supabase } from '../utils/supabase';

/**
 * OAuth Callback Handler
 * This page handles the OAuth PKCE code exchange before redirecting to the intended destination.
 * It's designed to be a dedicated endpoint for OAuth callbacks.
 */
const AuthCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('processing');
    const [error, setError] = useState(null);
    const [debugInfo] = useState({
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        code: searchParams.get('code'),
        next: searchParams.get('next') || localStorage.getItem('oauth_redirect') || '/course'
    });
    const hasRun = useRef(false);

    useEffect(() => {
        // Prevent multiple executions
        if (hasRun.current) {
            console.log('⚠️ AuthCallback: Already processing, skipping duplicate call');
            return;
        }

        let isMounted = true;

        // Fail fast if Supabase is not configured (prevents infinite spinner)
        if (!supabase) {
            console.error('AuthCallback: Supabase client is not initialized. Check environment variables.');
            setStatus('error');
            const errMsg = 'Supabase is not configured. Please check Vercel environment variables.';
            setError(errMsg);
            toast.error(errMsg);
            return undefined;
        }

        // Determine redirect destination early (before timeout setup)
        // Get redirect destination from URL query parameter, localStorage backup, or default
        let nextParam = searchParams.get('next') || localStorage.getItem('oauth_redirect') || '/course';
        
        // Validate and sanitize the redirect path (prevent open redirects)
        // Only allow relative paths starting with /
        if (!nextParam.startsWith('/')) {
            console.warn('⚠️ AuthCallback: Invalid redirect path, defaulting to /course');
            nextParam = '/course';
        }

        // Safety timeout - force redirect if taking too long (increased to 15 seconds)
        const timeoutId = setTimeout(() => {
            if (isMounted && status === 'processing') {
                console.warn('⚠️ AuthCallback: Exchange taking too long, forcing redirect to', nextParam);
                console.log('Debug info:', debugInfo);
                toast.warning('Sign-in is taking longer than expected. Redirecting anyway...');
                navigate(nextParam, { replace: true });
            }
        }, 15000); // Increased from 5s to 15s

        const handleOAuthCallback = async () => {
            try {
                // 1. Get code from URL
                const code = searchParams.get('code');

                console.log('🔐 AuthCallback: Starting exchange...', { code: code ? 'present' : 'missing', next: nextParam });
                console.log('🔐 AuthCallback: Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
                console.log('🔐 AuthCallback: Supabase Key present:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
                console.log('🔐 AuthCallback: Supabase client exists:', !!supabase);

                // 3. Clear stored redirect after reading it
                localStorage.removeItem('oauth_redirect');

                // 4. Handle OAuth errors from provider
                const errorParam = searchParams.get('error');
                const errorDescription = searchParams.get('error_description');
                if (errorParam) {
                    throw new Error(errorDescription || errorParam);
                }

                // 5. If no code, check if we already have a session (might have been persisted)
                if (!code) {
                    console.log('⚠️ AuthCallback: No code in URL, checking for existing session...');
                    const { data: { session: existingSession } } = await supabase.auth.getSession();
                    if (existingSession) {
                        console.log('✅ AuthCallback: Existing session found, redirecting...');
                        if (isMounted) {
                            setStatus('success');
                            clearTimeout(timeoutId);
                            navigate(nextParam, { replace: true });
                        }
                        return;
                    }
                    throw new Error('No authorization code found in URL and no existing session');
                }

                // 6. Exchange code for session (Only once!)
                hasRun.current = true;
                console.log('🔐 AuthCallback: Exchanging code...', { code: code.substring(0, 20) + '...' });
                
                const exchangeStartTime = Date.now();
                const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                const exchangeDuration = Date.now() - exchangeStartTime;
                
                console.log(`🔐 AuthCallback: Exchange completed in ${exchangeDuration}ms`);

                if (exchangeError) {
                    console.error('❌ AuthCallback: Exchange error:', exchangeError);
                    console.error('Error details:', {
                        message: exchangeError.message,
                        status: exchangeError.status,
                        code: exchangeError.code
                    });
                    
                    // Handle specific error cases
                    if (exchangeError.message?.includes('code') || exchangeError.message?.includes('expired')) {
                        throw new Error('The authentication code has expired or already been used. Please try signing in again.');
                    }
                    
                    throw exchangeError;
                }

                if (data?.session) {
                    console.log('✅ AuthCallback: Exchange successful!', {
                        userId: data.session.user?.id,
                        email: data.session.user?.email
                    });
                    if (isMounted) {
                        setStatus('success');
                        clearTimeout(timeoutId); // Clear timeout since we succeeded
                        // Small delay to ensure state and storage are synced
                        setTimeout(() => navigate(nextParam, { replace: true }), 300);
                    }
                } else {
                    console.error('❌ AuthCallback: No session in response', data);
                    throw new Error('Authentication succeeded but no session was returned');
                }
            } catch (err) {
                console.error('❌ AuthCallback: Fatal error:', err);
                if (isMounted) {
                    setStatus('error');
                    setError(err.message || 'An unexpected error occurred during sign in');
                    toast.error(err.message || 'Authentication failed');
                }
            }
        };

        handleOAuthCallback();

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [searchParams, navigate]);

    if (status === 'processing') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100">
                <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950 mx-auto mb-4"></div>
                    <h2 className="text-xl font-bold text-neutral-900 mb-2">Completing Sign In</h2>
                    <p className="text-neutral-600">Please wait while we complete your sign in...</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100">
                <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-red-600 mb-2">Sign In Failed</h2>
                    <p className="text-neutral-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/login', { replace: true })}
                        className="bg-blue-950 text-white py-2 px-6 rounded-lg hover:bg-slate-900 transition"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    // Success state - will redirect shortly
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100">
            <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-green-600 mb-2">Sign In Successful</h2>
                <p className="text-neutral-600">Redirecting you now...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
