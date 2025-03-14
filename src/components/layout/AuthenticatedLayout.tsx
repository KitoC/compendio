import { ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppSidebar from "./AppSidebar";
import { ROUTES } from "@/lib/constants";
import { SidebarProvider } from "@/components/ui/sidebar";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

const AuthenticatedLayout = ({ children }: AuthenticatedLayoutProps) => {
  const { user, isLoading, hasTenant } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto h-screen">{children}</main>
      </div>
    </SidebarProvider>
  );
};

export default AuthenticatedLayout;
