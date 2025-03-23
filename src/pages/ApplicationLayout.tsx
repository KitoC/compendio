
import { ReactNode, useEffect, Suspense } from "react";
import { useLocation, useNavigate, Outlet, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppSidebar from "@/components/layout/AppSidebar";
import { ROUTES } from "@/lib/constants";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiAgentsProvider } from "@/contexts/AiAgents/AiAgentsProvider";
import { CustomTablesProvider } from "@/contexts/CustomTables/CustomTablesProvider";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { toast } from "sonner";
import { useTenantFromUrl } from "@/hooks/useTenantFromUrl";

interface AuthenticatedLayoutProps {
  children?: ReactNode;
}

const ApplicationLayout = ({ children }: AuthenticatedLayoutProps) => {
  const { user, isLoading: authLoading, hasTenant, tenantId: authTenantId } = useAuth();
  const { tenantId, urlTenantAlias, isCurrentTenant, isLoading: tenantLoading } = useTenantFromUrl();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!authLoading && !tenantLoading) {
      if (!user) {
        navigate(ROUTES.AUTH);
        return;
      }

      if (!hasTenant) {
        navigate(ROUTES.REQUEST_ACCESS);
        return;
      }

      // If URL has tenant but it doesn't match auth tenant, redirect to correct tenant
      if (tenantId && !isCurrentTenant) {
        toast.error("You don't have access to this tenant workspace");
        // Need to find the workspace name for the auth tenant ID
        navigate(`/${ROUTES.REQUEST_ACCESS}`);
        return;
      }
    }
  }, [user, authLoading, tenantLoading, hasTenant, urlTenantAlias, tenantId, authTenantId, isCurrentTenant, navigate, location.pathname]);

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

  // Only render if authenticated and has tenant access or on request access pages
  if (
    !user ||
    (!hasTenant &&
      !location.pathname.includes(ROUTES.REQUEST_ACCESS) &&
      !location.pathname.includes(ROUTES.ACCESS_PENDING))
  ) {
    return null;
  }

  return (
    <TooltipProvider>
      <AiAgentsProvider>
        <CustomTablesProvider>
          <SidebarProvider>
            <div className="flex flex-col min-h-screen w-full">
              {isMobile && (
                <header className="sticky top-0 z-40 flex items-center h-14 px-4 border-b bg-background">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mr-2"
                    onClick={() =>
                      document.dispatchEvent(
                        new CustomEvent("toggle-sidebar")
                      )
                    }
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                  <div id="page-header-anchor" className="flex-1"></div>
                </header>
              )}
              <div className="flex flex-1 min-h-0">
                <AppSidebar />
                <main className="flex-1 overflow-auto h-screen">
                  <Suspense
                    fallback={
                      <div className="flex justify-center items-center h-full p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    }
                  >
                    {children || <Outlet />}
                  </Suspense>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </CustomTablesProvider>
      </AiAgentsProvider>
    </TooltipProvider>
  );
};

export default ApplicationLayout;
