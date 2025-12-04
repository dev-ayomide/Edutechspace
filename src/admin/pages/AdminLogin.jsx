import { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthProvider';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, googleLogin, fetchProfile, user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle Google OAuth callback - check if user is admin after redirect
  useEffect(() => {
    const checkAdminAfterGoogleLogin = async () => {
      // Check if this is an OAuth callback (has code parameter)
      const isOAuthCallback = searchParams.get('code') !== null;
      
      // Only proceed if we have a user, auth is loaded, and this is an OAuth callback
      if (!user || authLoading || !isOAuthCallback) {
        return;
      }

      try {
        // Fetch fresh user profile to get latest role
        const userProfile = await fetchProfile();
        
        if (userProfile?.role === 'admin') {
          toast.success('Admin login successful!');
          // Clear the code parameter from URL
          navigate('/admin/dashboard', { replace: true });
        } else {
          // User is not admin
          toast.error('Access denied. Admin privileges required.');
          // Sign out non-admin users
          const { supabase } = await import('../../utils/supabase');
          await supabase.auth.signOut();
          // Clear URL parameters
          navigate('/admin/login', { replace: true });
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        toast.error('Failed to verify admin access');
      }
    };

    checkAdminAfterGoogleLogin();
  }, [user, authLoading, fetchProfile, navigate, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      const userProfile = await fetchProfile();
      
      if (userProfile?.role === 'admin') {
        toast.success('Login successful!');
        navigate('/admin/dashboard');
      } else {
        toast.error('Access denied. Admin privileges required.');
        // Sign out non-admin users
        const { supabase } = await import('../../utils/supabase');
        await supabase.auth.signOut();
      }
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Redirect back to admin login page after Google OAuth
      // The useEffect will check admin status and redirect to dashboard if admin
      await googleLogin('/admin/login');
    } catch (error) {
      toast.error('Google login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access the admin dashboard
          </p>
        </div>

        {/* Google OAuth temporarily disabled - uncomment below to enable */}
        {/* 
        <div className="mt-8">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center border border-gray-300 bg-white text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.649,9.486-11.854L12.545,10.239z"
              />
            </svg>
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>
        </div>

        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-600">or</span>
          </div>
        </div>
        */}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        <ToastContainer position="bottom-right" />
      </div>
    </div>
  );
};

export default AdminLogin;

