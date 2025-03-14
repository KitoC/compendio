
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      // Get the URL hash for the token
      const hash = window.location.hash;
      
      if (hash && hash.includes('access_token')) {
        // Process the callback
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error with auth callback:', error);
          navigate('/auth');
        } else {
          // Successfully authenticated, redirect to home
          navigate('/');
        }
      } else {
        // No access token, redirect to auth page
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-lg">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
