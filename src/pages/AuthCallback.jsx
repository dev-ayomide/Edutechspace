import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { supabase, handleOAuthCallback } from '../utils/supabase';

/**
 * OAuth Callback Handler
 * 
 * This component handles the OAuth callback by exchanging the authorization code
 * for a session. Since detectSessionInUrl is false, we manually handle the exchange.
 * 
 * @see https://supabase.com/docs/guides/auth/social-login/auth-google
 */
const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing');
    const [error, setError] = useState(null);
    const hasProcessed = useRef(false);

    useEffect(() => {
        // Prevent double processing (React StrictMode)
        if (hasProcessed.current) return;
        hasProcessed.current = true;

        // Get redirect destination
        let redirectTo = searchParams.get('next') || localStorage.getItem('oauth_redirect') || '/course';
        if (!redirectTo.startsWith('/')) {
            redirectTo = '/course';
        }
        localStorage.removeItem('oauth_redirect');
        
        // Check for OAuth errors from provider
        const errorParam = searchParams.get('error');
        if (errorParam) {
            const errorMsg = searchParams.get('error_description') || errorParam;
            console.error('❌ OAuth error from provider:', errorMsg);
            setStatus('error');
            setError(errorMsg);
            toast.error(errorMsg);
            setTimeout(() => navigate('/login', { replace: true }), 2500);
            return;
        }

        if (!supabase) {
            setStatus('error');
            setError('Configuration error');
            return;
        }

        const processOAuth = async () => {
            console.log('🔐 AuthCallback: Starting OAuth processing...');
            console.log('🔐 AuthCallback: URL:', window.location.href);
            
            try {
                // Exchange the code for a session
                const { data, error: authError } = await handleOAuthCallback();
                
                if (authError) {
                    console.error('❌ AuthCallback: Auth error:', authError.message);
                    setStatus('error');
                    setError(authError.message || 'Authentication failed');
                    toast.error('Sign in failed. Please try again.');
                    setTimeout(() => navigate('/login', { replace: true }), 2500);
                    return;
                }
                
                if (data?.session) {
                    console.log('✅ AuthCallback: Got session!', data.session.user?.email);
                    setStatus('success');
                    toast.success('Signed in successfully!');
                    
                    // Small delay to ensure session is persisted, then redirect
                    setTimeout(() => {
                        window.location.href = redirectTo;
                    }, 500);
                } else {
                    console.error('❌ AuthCallback: No session returned');
                    setStatus('error');
                    setError('No session received');
                    toast.error('Sign in failed. Please try again.');
                    setTimeout(() => navigate('/login', { replace: true }), 2500);
                }
            } catch (err) {
                console.error('❌ AuthCallback: Exception:', err);
                setStatus('error');
                setError(err.message || 'An unexpected error occurred');
                toast.error('Sign in failed. Please try again.');
                setTimeout(() => navigate('/login', { replace: true }), 2500);
            }
        };

        processOAuth();
    }, [searchParams, navigate]);

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
