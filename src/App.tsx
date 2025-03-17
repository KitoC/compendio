import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { ROUTES } from "@/lib/constants";
import ErrorBoundary from "@/components/ErrorBoundary";
import { UserSettingsProvider } from "@/contexts/UserSettingsProvider";
// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Lazy loaded pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const RequestAccess = lazy(() => import("./pages/RequestAccess"));
const AccessPending = lazy(() => import("./pages/AccessPending"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const Settings = lazy(() => import("./pages/Settings"));
const AppearanceSettings = lazy(
  () => import("./pages/settings/AppearanceSettings")
);
const AgentsSettings = lazy(() => import("./pages/settings/AgentsSettings"));

const queryClient = new QueryClient();

// Root layout for authenticated routes
const AuthenticatedRoot = () => (
  <AuthenticatedLayout>
    <Outlet />
  </AuthenticatedLayout>
);

// Root layout with providers
const Root = () => (
  <ErrorBoundary>
    <AuthProvider>
      <UserSettingsProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Sonner />
            <Suspense fallback={<LoadingFallback />}>
              <Outlet />
            </Suspense>
          </TooltipProvider>
        </ThemeProvider>
      </UserSettingsProvider>
    </AuthProvider>
  </ErrorBoundary>
);

// Create router with routes
const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      // Public routes
      { path: ROUTES.INDEX, element: <Index /> },
      { path: ROUTES.AUTH, element: <Auth /> },
      { path: ROUTES.AUTH_CALLBACK, element: <AuthCallback /> },
      { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPassword /> },
      { path: ROUTES.RESET_PASSWORD, element: <ResetPassword /> },

      // Access request routes
      { path: ROUTES.REQUEST_ACCESS, element: <RequestAccess /> },
      { path: ROUTES.ACCESS_PENDING, element: <AccessPending /> },

      // Protected routes with authenticated layout
      {
        element: <AuthenticatedRoot />,
        children: [
          { path: ROUTES.CONVERSATIONS, element: <ChatPage /> },
          { path: `${ROUTES.CONVERSATION}/:id`, element: <ChatPage /> },
          {
            path: ROUTES.SETTINGS,
            element: <Settings />,
            children: [
              { path: "appearance", element: <AppearanceSettings /> },
              { path: "agents", element: <AgentsSettings /> },
            ],
          },
        ],
      },

      // Catch-all
      { path: "*", element: <NotFound /> },
    ],
  },
]);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
