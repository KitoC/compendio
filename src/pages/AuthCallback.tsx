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

      try {
        // Get the URL hash or query params for the token
        const hash = window.location.hash;
        const query = window.location.search;

        if (sessionStorage.getItem("provider") === "azure") {
          const tokens = await exchangeAzureCodeForTokens(code);

          if (tokens) {
            const { id_token } = tokens;
            await supabase.auth.signInWithIdToken({
              provider: "azure",
              token: id_token,
            });
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

            // Successfully authenticated, redirect to home
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
