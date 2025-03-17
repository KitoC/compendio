import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { ROUTES } from "@/lib/constants";
import ErrorBoundary from "@/components/ErrorBoundary";

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

const queryClient = new QueryClient();

// Separate routes into public and protected
const AppContent = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Sonner />
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path={ROUTES.INDEX} element={<Index />} />
                <Route path={ROUTES.AUTH} element={<Auth />} />
                <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallback />} />
                <Route
                  path={ROUTES.FORGOT_PASSWORD}
                  element={<ForgotPassword />}
                />
                <Route
                  path={ROUTES.RESET_PASSWORD}
                  element={<ResetPassword />}
                />

                {/* Protected routes with sidebar */}
                <Route
                  path={ROUTES.CONVERSATIONS}
                  element={
                    <AuthenticatedLayout>
                      <ChatPage />
                    </AuthenticatedLayout>
                  }
                />
                <Route
                  path={`${ROUTES.CONVERSATION}/:id`}
                  element={
                    <AuthenticatedLayout>
                      <ChatPage />
                    </AuthenticatedLayout>
                  }
                />

                {/* Access request routes */}
                <Route
                  path={ROUTES.REQUEST_ACCESS}
                  element={<RequestAccess />}
                />
                <Route
                  path={ROUTES.ACCESS_PENDING}
                  element={<AccessPending />}
                />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
