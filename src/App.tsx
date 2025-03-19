// NO_CHANGE
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

/**
 * DEV_NOTE: We are using React Router v7 with the framework mode.
 * Any changes should preserve this architecture here within the App.tsx file:
 * - Follow strict React Router v7 documentation for the most part.
 * - Use the React Router v7 "createBrowserRouter" and "RouterProvider" functions.
 * - Use the React Router v7 "Outlet" component to render nested routes.
 * - Use the React Router v7 "useNavigate" hook to navigate between routes.
 * - Use the React Router v7 "useParams" hook to access route parameters.
 * - Use the React Router v7 "useLocation" hook to access the current location.
 * - Use the React Router v7 "useSearchParams" hook to access the current search parameters.
 * - Use the React Router v7 "useLoaderData" hook to access the data returned by loaders.
 * - Use the React Router v7 "useActionData" hook to access the data returned by actions.
 * - Use the React Router v7 "useNavigation" hook to access the navigation object.
 * - Use the React Router v7 "useSubmit" hook to submit forms.
 * - Ensure all pages and components are lazy loaded.
 * - Keep the configuration based pattern for the routes.
 * - Always use the ROUTES constant for the routes.
 *
 * */

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
const CustomTablesPage = lazy(
  () => import("./pages/settings/CustomTablesPage")
);
const CustomTableForm = lazy(() => import("./pages/settings/CustomTableForm"));

const CustomTableDataPage = lazy(() => import("./pages/CustomTableDataPage"));
const CustomRoleForm = lazy(() => import("./pages/settings/CustomRoleForm"));
const AppearanceSettings = lazy(
  () => import("./pages/settings/AppearanceSettings")
);
const AgentsSettings = lazy(() => import("./pages/settings/AgentsSettings"));
const AgentDetail = lazy(() => import("./pages/settings/AgentDetail"));

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
          { path: ROUTES.CONVERSATIONS_DETAIL, element: <ChatPage /> },
          {
            path: ROUTES.CUSTOM_TABLE_DATA,
            element: <CustomTableDataPage />,
          },
          {
            path: ROUTES.SETTINGS,
            element: <Settings />,
            children: [
              {
                path: ROUTES.SETTINGS_APPEARANCE,
                element: <AppearanceSettings />,
              },
              {
                path: ROUTES.SETTINGS_AGENTS,
                element: <AgentsSettings />,
              },
              {
                path: ROUTES.SETTINGS_CUSTOM_TABLES,
                element: <CustomTablesPage />,
              },
              { path: ROUTES.SETTINGS_AGENTS_DETAIL, element: <AgentDetail /> },
            ],
          },

          {
            path: ROUTES.SETTINGS_CUSTOM_ROLES_NEW,
            element: <CustomRoleForm />,
          },
          {
            path: ROUTES.SETTINGS_CUSTOM_ROLES_DETAIL,
            element: <CustomRoleForm />,
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
