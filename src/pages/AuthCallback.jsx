import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { supabase } from '../utils/supabase';

/**
 * OAuth Callback Handler
 * Handles the OAuth PKCE code exchange and redirects to the intended destination.
 * Uses window.location.href for redirect to ensure clean state initialization.
 */
const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('processing');
    const [error, setError] = useState(null);
    const hasRun = useRef(false);

    useEffect(() => {
        // Prevent multiple executions (React StrictMode protection)
        if (hasRun.current) return;
        hasRun.current = true;

        const handleOAuthCallback = async () => {
            // Get redirect destination
            let nextParam = searchParams.get('next') || localStorage.getItem('oauth_redirect') || '/course';
            
            // Validate path (prevent open redirects)
            if (!nextParam.startsWith('/')) {
                nextParam = '/course';
            }

            // Clear stored redirect
            localStorage.removeItem('oauth_redirect');

            try {
                // Fail fast if Supabase is not configured
                if (!supabase) {
                    throw new Error('Supabase is not configured. Check environment variables.');
                }

                // Handle OAuth errors from provider
                const errorParam = searchParams.get('error');
                if (errorParam) {
                    throw new Error(searchParams.get('error_description') || errorParam);
                }

                const code = searchParams.get('code');
                console.log('🔐 AuthCallback: Processing...', { hasCode: !!code, next: nextParam });

                // FIRST: Check if session already exists (might be from a refresh or race condition)
                const { data: { session: existingSession } } = await supabase.auth.getSession();
                
                if (existingSession) {
                    console.log('✅ AuthCallback: Session already exists, redirecting...');
                    setStatus('success');
                    toast.success('Signed in successfully!');
                    // Use window.location for clean redirect with full state refresh
                    window.location.href = nextParam;
                    return;
                }

                // No existing session - need to exchange the code
                if (!code) {
                    throw new Error('No authorization code found. Please try signing in again.');
                }

                console.log('🔐 AuthCallback: Exchanging code for session...');
                const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

                if (exchangeError) {
                    console.error('❌ Exchange error:', exchangeError);
                    
                    // Handle expired/used code
                    if (exchangeError.message?.includes('code') || 
                        exchangeError.message?.includes('expired') ||
                        exchangeError.message?.includes('invalid')) {
                        throw new Error('Sign-in link expired. Please try again.');
                    }
                    throw exchangeError;
                }

                if (!data?.session) {
                    throw new Error('No session returned. Please try again.');
                }

                console.log('✅ AuthCallback: Session created successfully!');
                setStatus('success');
                toast.success('Signed in successfully!');
                
                // CRITICAL: Use window.location.href instead of navigate()
                // This forces a full page reload which ensures AuthProvider 
                // initializes fresh with the new session from storage
                window.location.href = nextParam;

            } catch (err) {
                console.error('❌ AuthCallback error:', err);
                setStatus('error');
                setError(err.message || 'Authentication failed');
                toast.error(err.message || 'Sign in failed');
            }
        };

        handleOAuthCallback();
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
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    // Success state
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
