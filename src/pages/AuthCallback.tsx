
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
            const { id_token, access_token, refresh_token, expires_in } = tokens;
            
            // Sign in with the ID token
            await supabase.auth.signInWithIdToken({
              provider: "azure",
              token: id_token,
            });
            
            // If this was part of an integration flow, update the oauth_states table
            // and save the credentials
            if (oauthStateId) {
              // Get the OAuth state to retrieve service details
              const { data: oauthState } = await supabase
                .from("oauth_states")
                .select("*")
                .eq("id", oauthStateId)
                .single();
              
              if (oauthState) {
                // Update the oauth state with the token data
                await supabase
                  .from("oauth_states")
                  .update({ 
                    status: "completed",
                    token_data: tokens 
                  })
                  .eq("id", oauthStateId);
                
                // Calculate the expiration date
                const expiresAt = new Date();
                expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);
                
                // Create a connected service if it doesn't exist
                let connectedServiceId = null;
                
                if (!oauthState.connected_service_id) {
                  const { data: serviceData, error: serviceError } = await supabase
                    .from("connected_services")
                    .insert([{
                      agent_id: oauthState.agent_id,
                      service_type: oauthState.service_type,
                      name: `${oauthState.service_type} Integration`,
                      status: "active",
                      auth_type: "oauth",
                      tenant_id: oauthState.tenant_id,
                      config: oauthState.config || {}
                    }])
                    .select();
                  
                  if (serviceError) {
                    console.error("Error creating connected service:", serviceError);
                  } else if (serviceData && serviceData.length > 0) {
                    connectedServiceId = serviceData[0].id;
                  }
                } else {
                  connectedServiceId = oauthState.connected_service_id;
                }
                
                // Save the credentials
                if (connectedServiceId) {
                  // Check if a credential already exists for this service
                  const { data: existingCreds } = await supabase
                    .from("credentials")
                    .select("*")
                    .eq("connected_service_id", connectedServiceId)
                    .maybeSingle();
                  
                  // Define the credential data
                  const credentialData = {
                    username: tokens.email || "oauth_user",
                    password: "",
                    domain: oauthState.service_type,
                    type: "oauth",
                    connected_service_id: connectedServiceId,
                    tenant_id: oauthState.tenant_id,
                    expires_at: expiresAt.toISOString(),
                    access_token: access_token,
                    refresh_token: refresh_token,
                    scopes: tokens.scope ? tokens.scope.split(' ') : []
                  };
                  
                  if (existingCreds) {
                    // Update existing credential
                    await supabase
                      .from("credentials")
                      .update(credentialData)
                      .eq("id", existingCreds.id);
                  } else {
                    // Create new credential
                    await supabase
                      .from("credentials")
                      .insert([credentialData]);
                  }
                }
              }
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
