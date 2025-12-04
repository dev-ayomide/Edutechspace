import { Navigate, Outlet, useLocation } from 'react-router-dom';
import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthProvider";

const ProtectedRoute = ({ requireAdmin = false }) => {
  const { user, isAdmin, loading, isAuthenticated } = useContext(AuthContext);
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  // Give auth time to initialize, but don't block forever
  useEffect(() => {
    // If loading takes too long, proceed anyway (prevents blank screens)
    const timeout = setTimeout(() => {
      setIsChecking(false);
    }, 3000); // Increased timeout for slower connections

    if (!loading) {
      setIsChecking(false);
      clearTimeout(timeout);
    }

    return () => clearTimeout(timeout);
  }, [loading]);

  // Show loading only briefly during initial auth check
  if (isChecking && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user after loading, redirect to login
  if (!isChecking && !loading && !isAuthenticated && !user) {
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
