import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthProvider';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import ForgotPasswordMdl from '../component/dialog/ForgotPasswordMdl';
const Login = () => {
  const { login, googleLogin, loading, isAuthenticated, isOnline } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect authenticated users to /course
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/course', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
    const [isForgottenPasswordOpen, setIsForgottenPasswordOpen] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      // After successful login, navigate to /course
      // The useEffect will also try to redirect, but this ensures immediate navigation
      navigate('/course', { replace: true });
    } catch (err) {
      // Errors are handled in AuthProvider with toast
      // Don't navigate on error
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const openForgottenPassword = () => {
    setIsForgottenPasswordOpen(true);
  };

  const closeForgottenPassword = () => {
    setIsForgottenPasswordOpen(false);
  };

  return (
    <section className="flex flex-col items-center justify-start pt-20 pb-6 min-h-screen bg-neutral-100 px-6">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        {!isOnline && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            <strong>No Internet Connection</strong> - Please check your network and try again.
          </div>
        )}
        <h2 className="text-2xl font-bold text-neutral-900 mb-4 text-center">Welcome Back!</h2>
        <div className="mb-4">
          <button
            type="button"
            onClick={() => googleLogin()}
            disabled={loading || !isOnline}
            className="w-full flex items-center justify-center border border-neutral-300 bg-white text-neutral-700 py-2 px-4 rounded-lg hover:bg-neutral-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.649,9.486-11.854L12.545,10.239z"
              />
            </svg>
            Continue with Google
          </button>
        </div>
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-neutral-600">or</span>
          </div>
        </div>
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-neutral-700 font-bold">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-neutral-300 p-3 rounded-lg w-full focus:ring focus:ring-neutral-400"
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-neutral-700 font-bold">
              Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-neutral-300 p-3 rounded-lg w-full focus:ring focus:ring-neutral-400"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-10 text-neutral-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading || !isOnline}
            className="w-full bg-blue-950 text-white p-3 rounded-lg hover:bg-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : !isOnline ? 'No Connection' : 'Login'}
          </button>
        </form>
        <div className="text-center mt-4">
          <p className="text-neutral-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-neutral-900 font-semibold">
              Sign Up
            </Link>
          </p>
          <p className="text-neutral-600 mt-2">
            <button
              onClick={openForgottenPassword}
              className="text-neutral-900 font-semibold hover:underline"
            >
              Forgot my password
            </button>
          </p>
        </div>
        <ForgotPasswordMdl
          isOpen={isForgottenPasswordOpen}
          onClose={closeForgottenPassword}
          email={email}
          setEmail={setEmail}
        />
      </div>
    </section>
  );
};

export default Login;