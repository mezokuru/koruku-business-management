import { useEffect, useState, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [hasShownExpiryMessage, setHasShownExpiryMessage] = useState(false);
  const previousSessionRef = useRef<boolean>(false);

  useEffect(() => {
    // Track if we had a session before
    if (!loading) {
      if (session) {
        previousSessionRef.current = true;
      } else if (previousSessionRef.current && !session && !hasShownExpiryMessage) {
        // Session was lost (expired or signed out elsewhere)
        // Use queueMicrotask to avoid setState during render
        queueMicrotask(() => {
          toast.error('Session expired. Please login again.');
          setHasShownExpiryMessage(true);
        });
      }
    }
  }, [loading, session, hasShownExpiryMessage]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Render child routes if authenticated
  return <Outlet />;
}
