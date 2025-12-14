import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthProvider';

const Logout = () => {
  const { logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Automatically log out when component mounts
    const performLogout = async () => {
      try {
        await logout();
        // Logout function already handles navigation, but this is a fallback
        navigate('/', { replace: true });
      } catch (err) {
        // Errors are handled in AuthProvider with toast
        navigate('/', { replace: true });
      }
    };

    performLogout();
  }, [logout, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100 p-6">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950 mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Logging out...</h2>
        <p className="text-neutral-600">Please wait while we log you out.</p>
      </div>
    </div>
  );
};

export default Logout;