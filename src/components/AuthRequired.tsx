import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";

interface AuthRequiredProps {
  children: React.ReactNode;
}

const AuthRequired: React.FC<AuthRequiredProps> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const {
    urlTenantAlias,
    hasTenantAccess,
    hasPendingRequest,
    isLoading: tenantLoading,
  } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && !tenantLoading) {
      if (!user) {
        // Not authenticated, redirect to login
        navigate("/auth");
        return;
      }

      if (!urlTenantAlias) {
        // No tenant in URL, redirect to index
        navigate("/");
        return;
      }

      const isAccessRoute =
        location.pathname.includes("/request-access") ||
        location.pathname.includes("/access-pending");

      if (hasPendingRequest && !location.pathname.includes("/access-pending")) {
        // Redirect to pending access page
        navigate(`/${urlTenantAlias}/access-pending`);
        return;
      }

      if (!hasTenantAccess && !isAccessRoute) {
        // User doesn't have access, redirect to request access
        navigate(`/${urlTenantAlias}/request-access`);
        return;
      }
    }
  }, [
    user,
    authLoading,
    tenantLoading,
    hasTenantAccess,
    hasPendingRequest,
    urlTenantAlias,
    navigate,
    location.pathname,
  ]);

  if (authLoading || tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Only render children if authenticated and has appropriate tenant access for the route
  const isAccessRoute =
    location.pathname.includes("/request-access") ||
    location.pathname.includes("/access-pending");

  const shouldRender =
    user &&
    ((hasTenantAccess && !isAccessRoute) ||
      (hasPendingRequest && location.pathname.includes("/access-pending")) ||
      (!hasTenantAccess && location.pathname.includes("/request-access")));

  return shouldRender ? <>{children}</> : null;
};

export default AuthRequired;
