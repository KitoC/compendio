
import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import { QueryProvider } from "./contexts/QueryProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import RequestAccess from "./pages/RequestAccess";
import AccessPending from "./pages/AccessPending";
import Dashboard from "./pages/application-layout/Dashboard";
import ConversationDetail from "./pages/application-layout/ConversationDetail";
import CustomTableData from "./pages/application-layout/CustomTableData";
import ConversationAssistant from "./pages/application-layout/ConversationAssistant";
import { ROUTES } from "./lib/constants";
import AgentDetail from "./pages/application-layout/settings/AgentDetail";
import AgentWorkflowsSettings from "./pages/application-layout/settings/AgentWorkflowsSettings";
import AgentsSettings from "./pages/application-layout/settings/AgentsSettings";
import AppearanceSettings from "./pages/application-layout/settings/AppearanceSettings";
import CustomTableForm from "./pages/application-layout/settings/CustomTableForm";
import CustomRoleForm from "./pages/application-layout/settings/CustomRoleForm";
import CustomTablesPage from "./pages/application-layout/settings/CustomTablesPage";
import IntegrationsSettings from "./pages/application-layout/settings/IntegrationsSettings";
import IntegrationDetailPage from "./pages/application-layout/settings/IntegrationDetail";
import Settings from "./pages/application-layout/Settings";
import TableBuilderPage from "./pages/application-layout/settings/TableBuilderPage";
import WorkflowDetail from "./pages/application-layout/settings/WorkflowDetail";
import WorkflowsSettings from "./pages/application-layout/settings/WorkflowsSettings";
import WorkflowInstancesSettings from "./pages/application-layout/settings/WorkflowInstancesSettings";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./hooks/useAuth";
import ApplicationLayout from "./pages/ApplicationLayout";
import LandingPage from "./pages/LandingPage";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <QueryProvider>
        <Routes>
          <Route path={ROUTES.AUTH} element={<Auth />} />
          <Route path={ROUTES.INDEX} element={<LandingPage />} />
          <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallback />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
          <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
          <Route path={ROUTES.REQUEST_ACCESS} element={<RequestAccess />} />
          <Route path={ROUTES.ACCESS_PENDING} element={<AccessPending />} />

          <Route path={ROUTES.APPLICATION} element={<ApplicationLayout />}>
            <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />

            <Route
              path={ROUTES.CONVERSATIONS_DETAIL}
              element={<ConversationDetail />}
            />
            <Route path={ROUTES.CUSTOM_TABLE_DATA} element={<CustomTableData />} />
            <Route
              path={ROUTES.CONVERSATION_ASSISTANT}
              element={<ConversationAssistant />}
            />

            {/* Settings Routes */}
            <Route path={ROUTES.SETTINGS} element={<Settings />}>
              <Route
                path={ROUTES.SETTINGS_APPEARANCE}
                element={<AppearanceSettings />}
              />
              <Route path={ROUTES.SETTINGS_AGENTS} element={<AgentsSettings />} />
              <Route
                path={ROUTES.SETTINGS_AGENTS_DETAIL}
                element={<AgentDetail />}
              />
              <Route
                path={ROUTES.SETTINGS_AGENT_WORKFLOWS}
                element={<AgentWorkflowsSettings />}
              />
              <Route
                path={ROUTES.SETTINGS_WORKFLOWS}
                element={<WorkflowsSettings />}
              />
              <Route
                path={ROUTES.SETTINGS_WORKFLOW_DETAIL}
                element={<WorkflowDetail />}
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
                path={ROUTES.SETTINGS_CUSTOM_TABLES}
                element={<CustomTablesPage />}
              />
              <Route
                path={ROUTES.SETTINGS_CUSTOM_TABLES_DETAIL}
                element={<CustomTableForm />}
              />
              <Route
                path={ROUTES.SETTINGS_CUSTOM_TABLES_NEW}
                element={<CustomTableForm />}
              />
              <Route
                path={ROUTES.SETTINGS_CUSTOM_ROLES_DETAIL}
                element={<CustomRoleForm />}
              />
              <Route
                path={ROUTES.SETTINGS_CUSTOM_ROLES_NEW}
                element={<CustomRoleForm />}
              />
              <Route
                path={ROUTES.SETTINGS_TABLE_BUILDER}
                element={<TableBuilderPage />}
              />
              {/* Default Settings Route */}
              <Route
                index
                element={<Navigate to={ROUTES.SETTINGS_APPEARANCE} replace />}
              />
            </Route>

            <Route path={ROUTES.APPLICATION} element={<Dashboard />} />
            <Route path={ROUTES.NOT_FOUND} element={<Dashboard />} />
          </Route>
        </Routes>
      </QueryProvider>
      <Toaster />
    </ThemeProvider>
  );
}

const ProvidedApp = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

export default ProvidedApp;
