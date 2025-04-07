import { ReactNode, useEffect, Suspense, useRef } from "react";
import { useLocation, useNavigate, Outlet, matchPath } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppSidebar from "@/components/layout/AppSidebar";
import { ROUTES } from "@/lib/constants";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, SquareChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiAgentsProvider } from "@/contexts/AiAgents/AiAgentsProvider";
import { CustomTablesProvider } from "@/contexts/CustomTables/CustomTablesProvider";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { UserSettingsProvider } from "@/contexts/UserSettingsProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import clsx from "clsx";
import { useElementSize } from "@/hooks/useElementSize";

interface ApplicationLayoutProps {
  children?: ReactNode;
}

const ApplicationLayout = ({ children }: ApplicationLayoutProps) => {
  const { user, isLoading: authLoading } = useAuth();

  const headerRef = useRef<HTMLHeadElement>(null);
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

  const headerSize = useElementSize(headerRef);

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
        <PwaInstallPrompt />
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

  console.log("headerSize", headerSize);

  return (
    <UserSettingsProvider>
      <ThemeProvider defaultTheme="system">
        <TooltipProvider>
          <AiAgentsProvider>
            <CustomTablesProvider>
              <SidebarProvider
                className={clsx(
                  "flex min-h-screen w-full bg-background page-container",
                  isMobile && !isOnBoardingRoute && "flex-col"
                )}
                style={
                  {
                    "--header-height": `${headerSize.height}px`,
                  } as React.CSSProperties
                }
              >
                {isMobile && !isOnBoardingRoute && (
                  <header
                    ref={headerRef}
                    className="w-full z-40 flex items-center h-fit px-4 border-b bg-background shadow pt-safe-top"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mr-2 h-14 w-14 p-2"
                      onClick={() =>
                        document.dispatchEvent(
                          new CustomEvent("toggle-sidebar")
                        )
                      }
                    >
                      <Menu />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                    <div id="page-header-anchor" className="flex-1"></div>
                  </header>
                )}
                {!isOnBoardingRoute && <AppSidebar />}
                <main
                  className={clsx("flex-grow overflow-y-scroll relative", {
                    "h-screen": !isMobile && !isOnBoardingRoute,
                    "h-[calc(100vh-var(--header-height))] pb-[var(--page-bottom-padding)]":
                      isMobile && !isOnBoardingRoute,
                  })}
                >
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
                <PwaInstallPrompt />
              </SidebarProvider>
            </CustomTablesProvider>
          </AiAgentsProvider>
        </TooltipProvider>
      </ThemeProvider>
    </UserSettingsProvider>
  );
};

export default ApplicationLayout;
