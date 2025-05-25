import { ReactNode, useEffect, Suspense, useRef } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppSidebar from "@/components/layout/AppSidebar";
import { ROUTES } from "@/consts/routes";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiAgentsProvider } from "@/contexts/AiAgents/AiAgentsProvider";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { UserSettingsProvider } from "@/contexts/UserSettingsProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import clsx from "clsx";
import { SystemSettingsProvider } from "@/contexts/SystemSettingsProvider";
import { paths } from "@/utils/pathHelpers";
import { useTenant } from "@/contexts/TenantContext";
import { RealtimeAiAgentProvider } from "@/contexts/RealtimeAIAgent/RealtimeAiAgentProvider";
import useGlobalTools from "@/contexts/RealtimeAIAgent/hooks/useGlobalTools";

interface ApplicationLayoutProps {
  children?: ReactNode;
}

const ApplicationLayout = ({ children }: ApplicationLayoutProps) => {
  const { user, isLoading: authLoading } = useAuth();
  const { urlTenantAlias } = useTenant();

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

  const globalTools = useGlobalTools();

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

  const isOnBoardingRoute = location.pathname.match(
    /^\/([^/]+)\/app\/onboarding$/
  );
  // Check if the current route is an access route
  const isAccessRoute =
    location.pathname.includes("/request-access") ||
    location.pathname.includes("/access-pending") ||
    isOnBoardingRoute;

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

  const suspensedContent = (
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

  return (
    <SystemSettingsProvider>
      <UserSettingsProvider>
        <ThemeProvider defaultTheme="system">
          <TooltipProvider>
            <AiAgentsProvider>
              <RealtimeAiAgentProvider globalTools={globalTools}>
                <SidebarProvider
                  className={clsx(
                    "page-container flex min-h-screen w-full bg-background",
                    {
                      "flex flex-col overflow-hidden h-dvh pb-[calc(var(--page-bottom-padding))] pt-[var(--header-height)]":
                        isMobile,
                    }
                  )}
                  style={
                    {
                      "--header-height": "50px",
                    } as React.CSSProperties
                  }
                >
                  {<AppSidebar />}

                  {isMobile ? (
                    suspensedContent
                  ) : (
                    <div className="flex flex-col min-h-screen h-screen flex-grow overflow-hidden">
                      <header
                        ref={headerRef}
                        className="z-40  w-full flex items-center h-fit px-4 border-b bg-header py-2"
                      >
                        <div className="flex items-center">
                          {isMobile && (
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
                          )}
                          <div id="header-anchor-left"></div>
                        </div>

                        <div className="ml-auto">
                          <Button
                            onClick={() =>
                              navigate(paths.getNewQuotePath(urlTenantAlias))
                            }
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Create quote
                          </Button>
                        </div>
                      </header>

                      <main
                        className={clsx(
                          "flex-grow overflow-hidden relative",
                          isMobile &&
                            "h-[calc(100vh-var(--header-height))] pb-[var(--page-bottom-padding)]"
                        )}
                      >
                        {suspensedContent}
                      </main>
                    </div>
                  )}
                  <PwaInstallPrompt />
                </SidebarProvider>
              </RealtimeAiAgentProvider>
            </AiAgentsProvider>
          </TooltipProvider>
        </ThemeProvider>
      </UserSettingsProvider>
    </SystemSettingsProvider>
  );
};

export default ApplicationLayout;
