import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/lib/constants";
import { toast } from "sonner";
import { exchangeAzureCodeForTokens } from "@/utils/oAuthAzure";
import { getUrlParameter } from "@/utils/oAuthAzure";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      const code = getUrlParameter("code");
      const state = getUrlParameter("state");
      
      try {
        // Get the URL hash or query params for the token
        const hash = window.location.hash;
        const query = window.location.search;
        
        // Check if this is a return from an integration OAuth flow
        const integrationReturnUrl = sessionStorage.getItem("integration_return_url");
        const oauthStateId = sessionStorage.getItem("oauth_state_id");
        
        // Handle OAuth provider-specific token exchange
        if (sessionStorage.getItem("provider") === "azure") {
          const tokens = await exchangeAzureCodeForTokens(code);

          if (tokens) {
            const { id_token } = tokens;
            await supabase.auth.signInWithIdToken({
              provider: "azure",
              token: id_token,
            });
            
            // If this was part of an integration flow, update the oauth_states table
            if (oauthStateId) {
              await supabase
                .from("oauth_states")
                .update({ 
                  status: "completed",
                  token_data: tokens 
                })
                .eq("id", oauthStateId);
            }
          }
        }

        if (
          (hash && hash.includes("access_token")) ||
          (query && query.includes("code="))
        ) {
          // Process the callback
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            console.error("Error with auth callback:", error);
            toast.error("Authentication failed: " + error.message);
            navigate(ROUTES.AUTH);
          } else if (data.session) {
            toast.success("Successfully signed in!");

            // If we're returning from an integration flow, go back to the integration page
            if (integrationReturnUrl) {
              // Clean up session storage
              const wizardState = sessionStorage.getItem("integration_wizard_state");
              sessionStorage.removeItem("integration_return_url");
              sessionStorage.removeItem("oauth_state_id");
              sessionStorage.removeItem("code_verifier");
              sessionStorage.removeItem("oauth_state");
              sessionStorage.removeItem("provider");
              
              // Navigate back to the integration page
              toast.success("Successfully connected service!");
              navigate(ROUTES.SETTINGS_INTEGRATIONS);
              return;
            }

            // Otherwise, go to the default destination
            navigate(ROUTES.CONVERSATION_ASSISTANT, { replace: true });
          } else {
            toast.error("Authentication failed: No session found");
            navigate(ROUTES.AUTH);
          }
        } else {
          // No access token, redirect to auth page
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
