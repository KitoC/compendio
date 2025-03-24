import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/lib/constants";
import { toast } from "sonner";
import { getUrlParameter } from "@/utils/oAuth/shared";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";
import { callSupabaseFunction } from "@/services/supabaseFunctionServices";

const AuthCallback = () => {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const navigate = useNavigate();

  const handleIntegrationCallback = useCallback(async () => {
    if (!user || !tenantId) {
      return;
    }

    const code = getUrlParameter("code");
    const state = getUrlParameter("state");
    const redirectUrl = sessionStorage.getItem("integration_return_url");
    const credentialName = sessionStorage.getItem("credential_name");

    try {
      if (!code || !state) {
        toast.error("Invalid OAuth callback");
        // navigate(ROUTES.AUTH);
        return;
      }

      const response = await callSupabaseFunction("handle_oauth_callback", {
        code,
        state,
        options: {
          credential_name: credentialName,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "OAuth callback failed");
        console.error("OAuth error:", result);
        return;
      }

      // Optionally store credential ID for later use
      if (result.credential_id) {
        sessionStorage.setItem("credential_id", result.credential_id);
      }

      toast.success("Integration connected successfully");

      window.location.href =
        redirectUrl ||
        ROUTES.SETTINGS_INTEGRATIONS.replace(":tenantId", tenantId);
    } catch (error) {
      console.error("OAuth callback exception:", error);
      toast.error("Failed to connect integration");
    }
  }, [user, tenantId]);

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
        navigate(ROUTES.AUTH);

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

        if (error) {
          toast.error("Authentication failed: " + error.message);
          navigate(ROUTES.AUTH);
        } else if (data.session) {
          toast.success("Successfully signed in!");
          navigate(ROUTES.CONVERSATION_ASSISTANT, { replace: true });
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
    if (sessionStorage.getItem("integration_return_url")) {
      handleIntegrationCallback();
    } else {
      handleAuthCallback();
    }
  }, [navigate, handleIntegrationCallback, handleAuthCallback, user, tenantId]);

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
