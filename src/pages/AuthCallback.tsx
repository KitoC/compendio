
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ROUTES } from '@/lib/constants';
import { toast } from 'sonner';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      console.log("Auth callback page loaded, processing authentication...");
      
      try {
        // Get the URL hash or query params for the token
        const hash = window.location.hash;
        const query = window.location.search;
        
        if ((hash && hash.includes('access_token')) || (query && query.includes('code='))) {
          // Process the callback
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error with auth callback:', error);
            toast.error("Authentication failed: " + error.message);
            navigate(ROUTES.AUTH);
          } else if (data.session) {
            console.log("Authentication successful, redirecting to home");
            toast.success("Successfully signed in!");
            // Successfully authenticated, redirect to home
            navigate(ROUTES.CONVERSATION_ASSISTANT, { replace: true });
          } else {
            console.log("No session found after callback");
            toast.error("Authentication failed: No session found");
            navigate(ROUTES.AUTH);
          }
        } else {
          // No access token, redirect to auth page
          console.log("No authentication tokens found in URL");
          navigate(ROUTES.AUTH);
        }
      } catch (error) {
        console.error("Error processing auth callback:", error);
        toast.error("An unexpected error occurred during authentication");
        navigate(ROUTES.AUTH);
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
