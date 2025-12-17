import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

    useEffect(() => {
        let isMounted = true;

        const handleOAuthCallback = async () => {
            try {
                const code = searchParams.get('code');
                const errorParam = searchParams.get('error');
                const errorDescription = searchParams.get('error_description');

                // Get the next parameter before any processing - Supabase may modify params
                const nextParam = searchParams.get('next') || localStorage.getItem('oauth_redirect') || '/course';
                // Clear any stored redirect
                localStorage.removeItem('oauth_redirect');

                // Handle OAuth errors
                if (errorParam) {
                    console.error('OAuth error:', errorParam, errorDescription);
                    setStatus('error');
                    setError(errorDescription || errorParam);
                    return;
                }

                if (!code) {
                    // No code - check if user is already authenticated
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        console.log('✅ Already authenticated, redirecting...');
                        setStatus('success');
                        setTimeout(() => {
                            if (isMounted) {
                                navigate(nextParam, { replace: true });
                            }
                        }, 300);
                        return;
                    }
                    console.error('No code parameter found');
                    setStatus('error');
                    setError('No authorization code found');
                    return;
                }

                console.log('🔐 Exchanging OAuth code for session...');

                // Exchange the code for a session
                const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

                if (!isMounted) return;

                if (exchangeError) {
                    console.error('Code exchange error:', exchangeError);
                    setStatus('error');
                    setError(exchangeError.message);
                    return;
                }

                if (data.session) {
                    console.log('✅ OAuth session established successfully');
                    setStatus('success');

                    // Small delay to ensure session is persisted
                    setTimeout(() => {
                        if (isMounted) {
                            navigate(nextParam, { replace: true });
                        }
                    }, 500);
                } else {
                    setStatus('error');
                    setError('No session returned from authentication');
                }
            } catch (err) {
                console.error('OAuth callback error:', err);
                if (isMounted) {
                    setStatus('error');
                    setError(err.message || 'An unexpected error occurred');
                }
            }
        };

        handleOAuthCallback();

        return () => {
            isMounted = false;
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
