import { useEffect, useState, useRef, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { supabase } from '../utils/supabase';
import { AuthContext } from '../context/AuthProvider';

/**
 * OAuth Callback Handler
 * Waits for Supabase to process the OAuth code and establish a session,
 * then waits for AuthProvider to sync user data before redirecting.
 */
const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isAuthenticated, user, loading: authLoading } = useContext(AuthContext);
    const [status, setStatus] = useState('processing');
    const [error, setError] = useState(null);
    const hasProcessed = useRef(false);
    const redirectAttempted = useRef(false);
    const nextParamRef = useRef('/course');

    useEffect(() => {
        if (hasProcessed.current) return;
        hasProcessed.current = true;

        // Get redirect destination
        let nextParam = searchParams.get('next') || localStorage.getItem('oauth_redirect') || '/course';
        if (!nextParam.startsWith('/')) nextParam = '/course';
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

        const code = searchParams.get('code');
        console.log('🔐 AuthCallback: Starting...', { hasCode: !!code, next: nextParam });

        // Supabase automatically processes the code when detectSessionInUrl is true
        // AuthProvider's onAuthStateChange will handle the session
    }, [searchParams, navigate]);

    // Watch for authentication state and redirect when ready
    useEffect(() => {
        // Don't redirect if we've already attempted or if there's an error
        if (redirectAttempted.current || status === 'error') return;

        // Don't redirect while auth is still loading
        if (authLoading) return;

        // Wait for AuthProvider to authenticate and sync user
        if (isAuthenticated && user) {
            console.log('✅ AuthCallback: User authenticated and synced!', user.email);
            redirectAttempted.current = true;
            setStatus('success');
            toast.success('Signed in successfully!');
            
            // Use window.location for reliable redirect
            setTimeout(() => {
                window.location.href = nextParamRef.current;
            }, 300);
            return;
        }

        // Fallback: If we've been waiting too long, check session directly
        const timeoutId = setTimeout(async () => {
            if (redirectAttempted.current || isAuthenticated) return;

            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                
                if (sessionError) {
                    console.error('❌ AuthCallback: Session error:', sessionError);
                    return;
                }

                if (session?.user) {
                    console.log('⚠️ AuthCallback: Session found but auth not ready, redirecting anyway...', session.user.email);
                    redirectAttempted.current = true;
                    setStatus('success');
                    // Redirect - AuthProvider will sync in background
                    setTimeout(() => {
                        window.location.href = nextParamRef.current;
                    }, 300);
                } else {
                    console.error('❌ AuthCallback: No session found after delay');
                    setStatus('error');
                    setError('Sign in failed. Please try again.');
                    setTimeout(() => navigate('/login', { replace: true }), 2000);
                }
            } catch (err) {
                console.error('❌ AuthCallback: Error checking session:', err);
                setStatus('error');
                setError('Sign in failed. Please try again.');
                setTimeout(() => navigate('/login', { replace: true }), 2000);
            }
        }, 5000); // Wait 5 seconds for auth to be ready

        return () => clearTimeout(timeoutId);
    }, [isAuthenticated, user, authLoading, status, navigate]);

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
