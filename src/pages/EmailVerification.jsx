import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthProvider';
import { supabase } from '../utils/supabase';
import { toast } from 'react-toastify';

const EmailVerification = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useContext(AuthContext);
    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                // Supabase sends tokens in hash fragment
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const type = hashParams.get('type');

                // Check for error in hash (Supabase sometimes sends errors this way)
                const errorDescription = hashParams.get('error_description');
                if (errorDescription) {
                    setStatus('error');
                    setMessage(decodeURIComponent(errorDescription));
                    return;
                }

                if (!accessToken) {
                    // If no tokens in hash, check if already authenticated
                    if (isAuthenticated) {
                        setStatus('success');
                        setMessage('Your email has been verified! Redirecting...');
                        setTimeout(() => navigate('/dashboard'), 2000);
                        return;
                    }

                    setStatus('error');
                    setMessage('Invalid verification link. Please try signing up again.');
                    return;
                }

                // Set the session from the tokens
                const { data, error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken || ''
                });

                if (error) {
                    console.error('Verification error:', error);
                    setStatus('error');
                    setMessage(error.message || 'Failed to verify email. The link may have expired.');
                    return;
                }

                if (data.session) {
                    setStatus('success');
                    setMessage('Email verified successfully! Redirecting to your dashboard...');
                    setTimeout(() => navigate('/dashboard'), 2000);
                } else {
                    setStatus('success');
                    setMessage('Email verified! Please log in to continue.');
                    setTimeout(() => navigate('/login'), 2000);
                }

            } catch (err) {
                console.error('Email verification error:', err);
                setStatus('error');
                setMessage('An error occurred during verification. Please try again.');
            }
        };

        verifyEmail();
    }, [navigate, isAuthenticated]);

    return (
        <section className="flex flex-col items-center justify-center min-h-screen bg-neutral-100 p-6">
            <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
                {status === 'verifying' && (
                    <>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950 mx-auto mb-4"></div>
                        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Verifying Email</h2>
                        <p className="text-neutral-600">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-green-600 mb-2">Email Verified!</h2>
                        <p className="text-neutral-600">{message}</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h2>
                        <p className="text-neutral-600 mb-4">{message}</p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => navigate('/signup')}
                                className="bg-blue-950 text-white py-2 px-6 rounded-lg hover:bg-slate-900 transition"
                            >
                                Sign Up Again
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="text-neutral-900 font-semibold hover:underline"
                            >
                                Back to Login
                            </button>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};

export default EmailVerification;
