import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { supabase } from '../utils/supabase';

/**
 * OAuth Callback Handler
 * Supabase automatically handles PKCE code exchange via INITIAL_SESSION event,
 * so we just wait for the session to appear.
 */
const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('processing');
    const [error, setError] = useState(null);
    const hasProcessed = useRef(false);

    useEffect(() => {
        if (hasProcessed.current) return;
        hasProcessed.current = true;

        const processCallback = async () => {
            // Get redirect destination
            let nextParam = searchParams.get('next') || localStorage.getItem('oauth_redirect') || '/course';
            if (!nextParam.startsWith('/')) nextParam = '/course';
            localStorage.removeItem('oauth_redirect');

            // Check for OAuth errors from provider
            const errorParam = searchParams.get('error');
            if (errorParam) {
                const errorMsg = searchParams.get('error_description') || errorParam;
                console.error('❌ OAuth error from provider:', errorMsg);
                setStatus('error');
                setError(errorMsg);
                toast.error(errorMsg);
                return;
            }

            if (!supabase) {
                setStatus('error');
                setError('App configuration error');
                return;
            }

            const code = searchParams.get('code');
            console.log('🔐 AuthCallback: Starting...', { hasCode: !!code, next: nextParam });

            try {
                // Supabase automatically processes the code in the URL when detectSessionInUrl is true
                // OR when the client initializes. We just need to wait for the session.
                
                // Listen for auth state changes
                const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                    console.log('🔐 AuthCallback: Auth event:', event, { hasSession: !!session });

                    if (event === 'SIGNED_IN' && session) {
                        console.log('✅ AuthCallback: Sign in successful via event!', session.user?.email);
                        setStatus('success');
                        toast.success('Signed in successfully!');
                        subscription.unsubscribe();
                        window.location.replace(nextParam);
                    } else if (event === 'INITIAL_SESSION' && session) {
                        console.log('✅ AuthCallback: Initial session detected!', session.user?.email);
                        setStatus('success');
                        toast.success('Signed in successfully!');
                        subscription.unsubscribe();
                        window.location.replace(nextParam);
                    }
                });

                // Also poll for session (in case events fire before we subscribe)
                let attempts = 0;
                const maxAttempts = 30; // 15 seconds max (500ms * 30)
                
                const checkSession = async () => {
                    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                    
                    if (sessionError) {
                        console.error('❌ getSession error:', sessionError);
                    }
                    
                    if (session) {
                        console.log('✅ AuthCallback: Session found via polling!', session.user?.email);
                        subscription.unsubscribe();
                        setStatus('success');
                        toast.success('Signed in successfully!');
                        window.location.replace(nextParam);
                        return;
                    }
                    
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(checkSession, 500);
                    } else {
                        console.error('❌ Timeout waiting for session');
                        subscription.unsubscribe();
                        setStatus('error');
                        setError('Sign in timed out. Please try again.');
                    }
                };

                // Start checking immediately
                checkSession();
                
            } catch (err) {
                console.error('❌ AuthCallback error:', err);
                setStatus('error');
                setError(err.message || 'Sign in failed. Please try again.');
                toast.error(err.message || 'Sign in failed');
            }
        };

        processCallback();
    }, [searchParams]);

    if (status === 'processing') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100">
                <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950 mx-auto mb-4"></div>
                    <h2 className="text-xl font-bold text-neutral-900 mb-2">Completing Sign In</h2>
                    <p className="text-neutral-600">Please wait...</p>
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
                        onClick={() => window.location.href = '/login'}
                        className="bg-blue-950 text-white py-2 px-6 rounded-lg hover:bg-slate-900 transition"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100">
            <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-green-600 mb-2">Success!</h2>
                <p className="text-neutral-600">Redirecting...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
