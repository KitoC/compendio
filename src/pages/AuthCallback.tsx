import { useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/lib/constants";
import { toast } from "sonner";
import { getUrlParameter } from "@/utils/oAuth/shared";
import { callSupabaseFunction } from "@/services/supabaseFunctionServices";
import { OAUTH_INTEGRATION_CALLBACK_DATA_KEY } from "@/components/integrations/AddIntegrationWizard/steps/Authentication";

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleAuthCallback = useCallback(async () => {
    const code = getUrlParameter("code");
    const state = getUrlParameter("state");

    if (sessionStorage.getItem("provider") === "azure") {
      const response = await callSupabaseFunction("handle_oauth_callback", {
        code,
        state,
        id_token_only: true,
      });

      const result = await response.json();

      if (result.id_token) {
        await supabase.auth.signInWithIdToken({
          provider: "azure",
          token: result.id_token,
        });
        navigate(ROUTES.DASHBOARD, { replace: true });

        return;
      }
    }

    try {
      const hash = window.location.hash;
      const query = window.location.search;

      if (
        (hash && hash.includes("access_token")) ||
        (query && query.includes("code="))
      ) {
        const { data, error } = await supabase.auth.getSession();

        if (data.session) {
          navigate(ROUTES.DASHBOARD, { replace: true });
        }

        if (error) {
          toast.error("Authentication failed: " + error.message);
          navigate(ROUTES.AUTH);
        } else if (data.session) {
          toast.success("Successfully signed in!");
          navigate(ROUTES.DASHBOARD, { replace: true });
        } else {
          toast.error("Authentication failed: No session found");
          navigate(ROUTES.AUTH);
        }
      } else {
        navigate(ROUTES.AUTH);
      }
    } catch (error) {
      console.error("Auth callback error:", error);
      toast.error("An unexpected error occurred during authentication");
      navigate(ROUTES.AUTH);
    }
  }, [navigate]);

  useEffect(() => {
    if (sessionStorage.getItem(OAUTH_INTEGRATION_CALLBACK_DATA_KEY)) {
      const oauthCallbackData = JSON.parse(
        sessionStorage.getItem(OAUTH_INTEGRATION_CALLBACK_DATA_KEY) || "{}"
      );

      const path = oauthCallbackData.returnUrl;
      const integrationCallbackUrl = path + location.search;

      navigate(integrationCallbackUrl);
    } else {
      handleAuthCallback();
    }
  }, [handleAuthCallback, location, navigate]);

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
