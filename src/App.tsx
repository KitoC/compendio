import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import { QueryProvider } from "./contexts/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import RequestAccess from "./pages/RequestAccess";
import AccessPending from "./pages/AccessPending";
import Dashboard from "./pages/application-layout/Dashboard";
import AgentChat from "./pages/application-layout/AgentChat";
import { ROUTES, SETTINGS_ROUTES } from "./consts/routes";
import AppearanceSettings from "./pages/application-layout/settings/AppearanceSettings";
import CustomRoleForm from "./pages/application-layout/settings/CustomRoleForm";
import IntegrationsSettings from "./pages/application-layout/settings/IntegrationsSettings";
import IntegrationDetailPage from "./pages/application-layout/settings/IntegrationDetailPage";
import Settings from "./pages/application-layout/Settings";
import WorkflowInstancesSettings from "./pages/application-layout/settings/WorkflowInstancesSettings";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./hooks/useAuth";
import ApplicationLayout from "./pages/ApplicationLayout";
import LandingPage from "./pages/LandingPage";
import { TenantProvider } from "./contexts/TenantContext";
import { SocketProvider } from "./contexts/SocketProvider";
import { TTSProvider } from "./contexts/TTSProvider";
import { VoiceProvider } from "./contexts/VoiceProvider";
import { NotificationProvider } from "./contexts/NotificationProvider";
import { PwaInstallPrompt } from "./components/PwaInstallPrompt";
import BetaAccess from "./pages/BetaAccess";
import {
  QuotesGridPage,
  QuoteItemsGridPage,
  QuotesIndex,
} from "./pages/application-layout/Quotes";
import { ClientsGridPage } from "./pages/application-layout/Clients/ClientsGridPage";
import NewQuote from "./pages/application-layout/Quotes/NewQuote";
import { StaffMembersGridPage } from "./pages/application-layout/StaffManagement/StaffMembersGridPage";
import AccountSettings from "./pages/application-layout/settings/AccountSettings";

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <TenantProvider>
          <SocketProvider>
            <NotificationProvider>
              <TTSProvider>
                <VoiceProvider>
                  <Routes>
                    <Route path={ROUTES.AUTH} element={<Auth />} />
                    <Route path={ROUTES.INDEX} element={<LandingPage />} />
                    <Route
                      path={ROUTES.AUTH_CALLBACK}
                      element={<AuthCallback />}
                    />
                    <Route
                      path={ROUTES.FORGOT_PASSWORD}
                      element={<ForgotPassword />}
                    />
                    <Route
                      path={ROUTES.RESET_PASSWORD}
                      element={<ResetPassword />}
                    />
                    <Route
                      path={ROUTES.REQUEST_ACCESS}
                      element={<RequestAccess />}
                    />
                    <Route path={ROUTES.BETA_ACCESS} element={<BetaAccess />} />
                    <Route
                      path={ROUTES.ACCESS_PENDING}
                      element={<AccessPending />}
                    />

                    <Route
                      path={ROUTES.APPLICATION}
                      element={<ApplicationLayout />}
                    >
                      <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                      <Route path={ROUTES.QUOTES_NEW} element={<NewQuote />} />
                      <Route path={ROUTES.QUOTES} element={<QuotesIndex />}>
                        <Route index element={<QuotesGridPage />} />
                        <Route
                          path={ROUTES.QUOTE_ITEMS}
                          element={<QuoteItemsGridPage />}
                        />
                      </Route>

                      <Route
                        path={ROUTES.CLIENTS}
                        element={<ClientsGridPage />}
                      />
                      <Route
                        path={ROUTES.STAFF_MEMBERS}
                        element={<StaffMembersGridPage />}
                      />
                      <Route path={ROUTES.AGENT_CHAT} element={<AgentChat />} />

                      {/* Settings Routes */}
                      <Route path={ROUTES.SETTINGS} element={<Settings />}>
                        <Route
                          path={SETTINGS_ROUTES.SETTINGS_ACCOUNT}
                          element={<AccountSettings />}
                        />
                        <Route
                          path={ROUTES.SETTINGS_APPEARANCE}
                          element={<AppearanceSettings />}
                        />
                        <Route
                          path={ROUTES.SETTINGS_INTEGRATIONS}
                          element={<IntegrationsSettings />}
                        />
                        <Route
                          path={ROUTES.SETTINGS_INTEGRATION_DETAIL}
                          element={<IntegrationDetailPage />}
                        />
                        <Route
                          path={ROUTES.SETTINGS_WORKFLOW_INSTANCES}
                          element={<WorkflowInstancesSettings />}
                        />
                        <Route
                          path={ROUTES.SETTINGS_CUSTOM_ROLES_DETAIL}
                          element={<CustomRoleForm />}
                        />
                        <Route
                          path={ROUTES.SETTINGS_CUSTOM_ROLES_NEW}
                          element={<CustomRoleForm />}
                        />
                        {/* Default Settings Route */}
                        <Route
                          index
                          element={
                            <Navigate to={ROUTES.SETTINGS_APPEARANCE} replace />
                          }
                        />
                      </Route>

                      <Route index element={<Dashboard />} />
                      <Route path="*" element={<Dashboard />} />
                    </Route>
                  </Routes>
                  <PwaInstallPrompt />
                  <Toaster />
                </VoiceProvider>
              </TTSProvider>
            </NotificationProvider>
          </SocketProvider>
        </TenantProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

const ProvidedApp = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>
);

export default ProvidedApp;
