import { Navigate, Outlet, useLocation } from 'react-router-dom';
import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthProvider";

const ProtectedRoute = ({ requireAdmin = false }) => {
  const { user, isAdmin, loading, isAuthenticated } = useContext(AuthContext);
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Give auth time to initialize properly
  useEffect(() => {
    // Shorter timeout since App.jsx now handles initial loading
    const timeout = setTimeout(() => {
      setIsChecking(false);
      // Only redirect if still no user after timeout
      if (!loading && !isAuthenticated && !user) {
        setShouldRedirect(true);
      }
    }, 800); // Reduced to 800ms since initial check is done

    // If loading completes, we can stop checking
    if (!loading) {
      const quickTimeout = setTimeout(() => {
        setIsChecking(false);
        if (!isAuthenticated && !user) {
          setShouldRedirect(true);
        }
      }, 200); // Reduced buffer time
      
      return () => {
        clearTimeout(timeout);
        clearTimeout(quickTimeout);
      };
    }

    return () => clearTimeout(timeout);
  }, [loading, isAuthenticated, user]);

  // Show loading state while checking authentication
  if (isChecking || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Only redirect after we're sure there's no session
  if (shouldRedirect && !isAuthenticated && !user) {
    console.log('🔒 No authentication found, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If admin is required, check if user is admin
  if (requireAdmin && user && !isAdmin?.()) {
    console.warn('Admin access check failed:', {
      userRole: user?.role,
      expectedRole: 'admin',
      userId: user?.id,
      userEmail: user?.email
    });
    return <Navigate to="/" replace />;
  }

  // Render the child routes - always render something to prevent blank screens
  return <Outlet />;
};

export default ProtectedRoute;
