import { ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppSidebar from "./AppSidebar";
import { ROUTES } from "@/lib/constants";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiAgentsProvider } from "@/contexts/AiAgents/AiAgentsProvider";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

const AuthenticatedLayout = ({ children }: AuthenticatedLayoutProps) => {
  const { user, isLoading, hasTenant } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not authenticated, redirect to login
        navigate(ROUTES.AUTH);
      } else if (
        !hasTenant &&
        !location.pathname.includes(ROUTES.REQUEST_ACCESS) &&
        !location.pathname.includes(ROUTES.ACCESS_PENDING)
      ) {
        // User has no tenant and isn't already on request access pages
        navigate(ROUTES.REQUEST_ACCESS);
      }
    }
  }, [user, isLoading, hasTenant, navigate, location.pathname]);

  if (isLoading) {
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
    <AiAgentsProvider>
      <SidebarProvider>
        <div className="flex flex-col min-h-screen w-full">
          {isMobile && (
            <header className="sticky top-0 z-40 flex items-center h-14 px-4 border-b bg-background">
              <Button
                variant="ghost"
                size="icon"
                className="mr-2"
                onClick={() =>
                  document.dispatchEvent(new CustomEvent("toggle-sidebar"))
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
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </AiAgentsProvider>
  );
};

export default AuthenticatedLayout;
