import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import RequestAccess from "./pages/RequestAccess";
import AccessPending from "./pages/AccessPending";
import Conversations from "./pages/Conversations";
import ConversationDetail from "./pages/ConversationDetail";
import CustomTableData from "./pages/CustomTableData";
import ConversationAssistant from "./pages/ConversationAssistant";
import { ROUTES } from "./lib/constants";
import AgentDetail from "./pages/settings/AgentDetail";
import AgentWorkflowsSettings from "./pages/settings/AgentWorkflowsSettings";
import AgentsSettings from "./pages/settings/AgentsSettings";
import AppearanceSettings from "./pages/settings/AppearanceSettings";
import CustomTableForm from "./pages/settings/CustomTableForm";
import CustomRoleForm from "./pages/settings/CustomRoleForm";
import CustomTablesPage from "./pages/settings/CustomTablesPage";
import IntegrationsSettings from "./pages/settings/IntegrationsSettings";
import IntegrationDetailPage from "./pages/settings/IntegrationDetail";
import Settings from "./pages/Settings";
import TableBuilderPage from "./pages/settings/TableBuilderPage";
import WorkflowDetail from "./pages/settings/WorkflowDetail";
import WorkflowsSettings from "./pages/settings/WorkflowsSettings";
import WorkflowInstancesSettings from "./pages/settings/WorkflowInstancesSettings";

function App() {
  return (
    <Router>
      <Routes>
        <Route path={ROUTES.AUTH} element={<Auth />} />
        <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallback />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
        <Route path={ROUTES.REQUEST_ACCESS} element={<RequestAccess />} />
        <Route path={ROUTES.ACCESS_PENDING} element={<AccessPending />} />
        <Route path={ROUTES.CONVERSATIONS} element={<Conversations />} />
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
          <Route path={ROUTES.SETTINGS_APPEARANCE} element={<AppearanceSettings />} />
          <Route path={ROUTES.SETTINGS_AGENTS} element={<AgentsSettings />} />
          <Route path={ROUTES.SETTINGS_AGENTS_DETAIL} element={<AgentDetail />} />
          <Route path={ROUTES.SETTINGS_AGENT_WORKFLOWS} element={<AgentWorkflowsSettings />} />
          <Route path={ROUTES.SETTINGS_WORKFLOWS} element={<WorkflowsSettings />} />
          <Route path={ROUTES.SETTINGS_WORKFLOW_DETAIL} element={<WorkflowDetail />} />
          <Route path={ROUTES.SETTINGS_INTEGRATIONS} element={<IntegrationsSettings />} />
          <Route path={ROUTES.SETTINGS_INTEGRATION_DETAIL} element={<IntegrationDetailPage />} />
          <Route path={ROUTES.SETTINGS_WORKFLOW_INSTANCES} element={<WorkflowInstancesSettings />} />
          <Route path={ROUTES.SETTINGS_CUSTOM_TABLES} element={<CustomTablesPage />} />
          <Route path={ROUTES.SETTINGS_CUSTOM_TABLES_DETAIL} element={<CustomTableForm />} />
          <Route path={ROUTES.SETTINGS_CUSTOM_TABLES_NEW} element={<CustomTableForm />} />
          <Route path={ROUTES.SETTINGS_CUSTOM_ROLES_DETAIL} element={<CustomRoleForm />} />
          <Route path={ROUTES.SETTINGS_CUSTOM_ROLES_NEW} element={<CustomRoleForm />} />
          <Route path={ROUTES.SETTINGS_TABLE_BUILDER} element={<TableBuilderPage />} />
          {/* Default Settings Route */}
          <Route index element={<Navigate to={ROUTES.SETTINGS_APPEARANCE} replace />} />
        </Route>

        <Route path={ROUTES.INDEX} element={<Conversations />} />
        <Route path={ROUTES.NOT_FOUND} element={<Conversations />} />
      </Routes>
    </Router>
  );
}

export default App;
