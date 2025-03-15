
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { ROUTES } from "@/lib/constants";
import ErrorBoundary from "@/components/ErrorBoundary";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import RequestAccess from "./pages/RequestAccess";
import AccessPending from "./pages/AccessPending";
import ChatPage from "./pages/ChatPage";

const queryClient = new QueryClient();

// Separate routes into public and protected
const AppContent = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public routes */}
              <Route path={ROUTES.INDEX} element={<Index />} />
              <Route path={ROUTES.AUTH} element={<Auth />} />
              <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallback />} />
              <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
              <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />

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
              {/* Add specific predefined alias route */}
              <Route
                path={ROUTES.CONVERSATION_ASSISTANT}
                element={
                  <AuthenticatedLayout>
                    <ChatPage />
                  </AuthenticatedLayout>
                }
              />

              {/* Access request routes */}
              <Route path={ROUTES.REQUEST_ACCESS} element={<RequestAccess />} />
              <Route path={ROUTES.ACCESS_PENDING} element={<AccessPending />} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
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
