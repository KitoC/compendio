
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface AuthRequiredProps {
  children: React.ReactNode;
}

const AuthRequired: React.FC<AuthRequiredProps> = ({ children }) => {
  const { user, isLoading, hasTenant } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not authenticated, redirect to login
        navigate('/auth');
      } else if (!hasTenant && 
                !location.pathname.includes('/request-access') && 
                !location.pathname.includes('/access-pending')) {
        // User has no tenant and isn't already on request access pages
        navigate('/request-access');
      }
    }
  }, [user, isLoading, hasTenant, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Only render children if authenticated and has tenant access
  // or is on the request access pages
  return user && (hasTenant || 
                  location.pathname.includes('/request-access') || 
                  location.pathname.includes('/access-pending')) 
    ? <>{children}</> 
    : null;
};

export default AuthRequired;
