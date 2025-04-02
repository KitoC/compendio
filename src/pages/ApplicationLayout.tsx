import { ReactNode, useEffect, Suspense } from "react";
import { useLocation, useNavigate, Outlet, matchPath } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { TenantProvider, useTenant } from "@/contexts/TenantContext";
import AppSidebar from "@/components/layout/AppSidebar";
import { ROUTES } from "@/lib/constants";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiAgentsProvider } from "@/contexts/AiAgents/AiAgentsProvider";
import { CustomTablesProvider } from "@/contexts/CustomTables/CustomTablesProvider";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { UserSettingsProvider } from "@/contexts/UserSettingsProvider";

interface ApplicationLayoutProps {
  children?: ReactNode;
}

const ApplicationLayout = ({ children }: ApplicationLayoutProps) => {
  const { user, isLoading: authLoading } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate(ROUTES.AUTH);
        return;
      }
    }
  }, [user, authLoading, navigate, location.pathname]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if the current route is an access route
  const isAccessRoute =
    location.pathname.includes("/request-access") ||
    location.pathname.includes("/access-pending");

  // For access routes, we don't need the app sidebar
  if (isAccessRoute) {
    return (
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-full p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }
      >
        {children || <Outlet />}
      </Suspense>
    );
  }

  // Only render if authenticated
  if (!user) {
    return null;
  }

  const isOnBoardingRoute = location.pathname.match(
    /^\/([^/]+)\/app\/onboarding$/
  );

  return (
    <UserSettingsProvider>
      <TooltipProvider>
        <AiAgentsProvider>
          <CustomTablesProvider>
            <SidebarProvider>
              <div className="flex flex-col min-h-screen w-full">
                {isMobile && !isOnBoardingRoute && (
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
                  {!isOnBoardingRoute && <AppSidebar />}
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
    </UserSettingsProvider>
  );
};

export default ApplicationLayout;
