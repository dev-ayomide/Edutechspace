import { useEffect, useState, useRef, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { supabase } from '../utils/supabase';
import { AuthContext } from '../context/AuthProvider';

/**
 * OAuth Callback Handler
 * 
 * For PKCE flow, this component explicitly exchanges the OAuth code for a session.
 * This follows the official Supabase documentation for handling OAuth callbacks.
 * 
 * @see https://supabase.com/docs/guides/auth/social-login/auth-google
 */
const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useContext(AuthContext);
    const [status, setStatus] = useState('processing');
    const [error, setError] = useState(null);
    const hasProcessed = useRef(false);
    const redirectAttempted = useRef(false);
    const nextParamRef = useRef('/course');

    useEffect(() => {
        if (hasProcessed.current) return;
        hasProcessed.current = true;

        const handleOAuthCallback = async () => {
            // Get redirect destination from URL param or localStorage backup
            let nextParam = searchParams.get('next') || localStorage.getItem('oauth_redirect') || '/course';
            if (!nextParam.startsWith('/')) {
                nextParam = '/course';
            }
            nextParamRef.current = nextParam;
            localStorage.removeItem('oauth_redirect');

            // Check for OAuth errors from provider
            const errorParam = searchParams.get('error');
            if (errorParam) {
                const errorMsg = searchParams.get('error_description') || errorParam;
                console.error('❌ OAuth error from provider:', errorMsg);
                setStatus('error');
                setError(errorMsg);
                toast.error(errorMsg);
                setTimeout(() => navigate('/login', { replace: true }), 2000);
                return;
            }

            if (!supabase) {
                setStatus('error');
                setError('App configuration error');
                setTimeout(() => navigate('/login', { replace: true }), 2000);
                return;
            }

            // Get the authorization code from URL
            const code = searchParams.get('code');
            console.log('🔐 AuthCallback: Processing...', { hasCode: !!code, next: nextParam });

            if (code) {
                try {
                    // First check if detectSessionInUrl already processed the code
                    // (This can happen because supabase client auto-processes codes on init)
                    const { data: existingSessionData } = await supabase.auth.getSession();
                    
                    if (existingSessionData?.session) {
                        console.log('✅ AuthCallback: Session already exists (auto-processed)!', existingSessionData.session.user?.email);
                        setStatus('success');
                        toast.success('Signed in successfully!');
                        setTimeout(() => {
                            console.log('🔐 AuthCallback: Redirecting to', nextParam);
                            window.location.href = nextParam;
                        }, 500);
                        return;
                    }

                    // PKCE Flow: Exchange the code for a session
                    // This is the recommended approach per Supabase docs
                    console.log('🔐 AuthCallback: Exchanging code for session...');
                    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

                    if (exchangeError) {
                        // Check if the error is because the code was already exchanged
                        // In this case, we should check for existing session
                        if (exchangeError.message?.includes('code') || exchangeError.message?.includes('expired') || exchangeError.message?.includes('invalid')) {
                            console.log('🔐 AuthCallback: Code exchange failed, checking for existing session...');
                            const { data: retrySessionData } = await supabase.auth.getSession();
                            
                            if (retrySessionData?.session) {
                                console.log('✅ AuthCallback: Found existing session after exchange error!', retrySessionData.session.user?.email);
                                setStatus('success');
                                toast.success('Signed in successfully!');
                                setTimeout(() => {
                                    window.location.href = nextParam;
                                }, 500);
                                return;
                            }
                        }
                        
                        console.error('❌ AuthCallback: Code exchange failed:', exchangeError);
                        setStatus('error');
                        setError(exchangeError.message || 'Failed to complete sign in');
                        toast.error(exchangeError.message || 'Failed to complete sign in');
                        setTimeout(() => navigate('/login', { replace: true }), 2000);
                        return;
                    }

                    if (data.session) {
                        console.log('✅ AuthCallback: Session established!', data.session.user?.email);
                        // Session is now established, AuthProvider will pick it up via onAuthStateChange
                        // Wait a moment for AuthProvider to sync, then redirect
                        setStatus('success');
                        toast.success('Signed in successfully!');
                        
                        // Give AuthProvider time to sync user data
                        setTimeout(() => {
                            console.log('🔐 AuthCallback: Redirecting to', nextParam);
                            window.location.href = nextParam;
                        }, 500);
                        return;
                    }
                } catch (err) {
                    console.error('❌ AuthCallback: Exception during code exchange:', err);
                    
                    // On exception, check if there's an existing session anyway
                    try {
                        const { data: fallbackSessionData } = await supabase.auth.getSession();
                        if (fallbackSessionData?.session) {
                            console.log('✅ AuthCallback: Found session after exception!', fallbackSessionData.session.user?.email);
                            setStatus('success');
                            toast.success('Signed in successfully!');
                            setTimeout(() => {
                                window.location.href = nextParam;
                            }, 500);
                            return;
                        }
                    } catch (sessionErr) {
                        console.error('❌ AuthCallback: Also failed to get session:', sessionErr);
                    }
                    
                    setStatus('error');
                    setError(err.message || 'An error occurred during sign in');
                    toast.error(err.message || 'An error occurred during sign in');
                    setTimeout(() => navigate('/login', { replace: true }), 2000);
                    return;
                }
            } else {
                // No code in URL - check if we already have a session
                // (This can happen if detectSessionInUrl already processed it)
                console.log('🔐 AuthCallback: No code found, checking for existing session...');
                
                try {
                    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                    
                    if (sessionError) {
                        console.error('❌ AuthCallback: Session check failed:', sessionError);
                        setStatus('error');
                        setError('Failed to verify sign in');
                        setTimeout(() => navigate('/login', { replace: true }), 2000);
                        return;
                    }

                    if (session) {
                        console.log('✅ AuthCallback: Existing session found!', session.user?.email);
                        setStatus('success');
                        toast.success('Signed in successfully!');
                        setTimeout(() => {
                            window.location.href = nextParam;
                        }, 500);
                        return;
                    } else {
                        console.error('❌ AuthCallback: No code and no session');
                        setStatus('error');
                        setError('Sign in failed. Please try again.');
                        setTimeout(() => navigate('/login', { replace: true }), 2000);
                        return;
                    }
                } catch (err) {
                    console.error('❌ AuthCallback: Exception checking session:', err);
                    setStatus('error');
                    setError('An error occurred. Please try again.');
                    setTimeout(() => navigate('/login', { replace: true }), 2000);
                }
            }
        };

        handleOAuthCallback();
    }, [searchParams, navigate]);

    // Additional watcher: If user becomes authenticated, redirect
    useEffect(() => {
        if (redirectAttempted.current || status === 'error') return;
        
        if (status === 'success' && isAuthenticated && user) {
            console.log('✅ AuthCallback: User fully authenticated, ensuring redirect...');
            redirectAttempted.current = true;
            // User is fully synced, redirect if not already
            window.location.href = nextParamRef.current;
        }
    }, [isAuthenticated, user, status]);

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
                        onClick={() => navigate('/login', { replace: true })}
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
