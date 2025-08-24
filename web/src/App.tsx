import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import AuthSetup from '@/features/auth/AuthSetup';
import ProjectSelectorLayout from '@/components/ProjectSelectorLayout';
import ProjectLayout from '@/features/projects/layouts/ProjectLayout';
import ResourceLayout from '@/features/resources/layouts/ResourceLayout';
import OrganizationLayout from '@/features/organizations/layouts/OrganizationLayout';
import ProtectedRoute from '@/features/auth/ProtectedRoute';
import ProjectListPage from '@/features/projects/pages/ProjectListPage';
import ResourcesPage from '@/features/resources/pages/ResourcesPage';
import ResourceDetailPage from '@/features/resources/pages/ResourceDetailPage';
import ResourceAccessPage from '@/features/resources/pages/ResourceAccessPage';
import ProjectSettingsPage from '@/features/projects/pages/ProjectSettingsPage';
import ProjectDetailPage from '@/features/projects/pages/ProjectDetailPage';
import ProjectAccessPage from '@/features/projects/pages/ProjectAccessPage';
import OrganizationAccessPage from '@/features/organizations/pages/OrganizationAccessPage';
import CreateRoleAssignmentPage from '@/features/access/pages/CreateRoleAssignmentPage';
import LoginPage from '@/features/auth/LoginPage';
import AuthCallbackPage from '@/features/auth/callback';
import NotFoundPage from '@/pages/NotFoundPage';
import OrganizationOverviewPage from '@/features/organizations/pages/OrganizationOverviewPage';
import OrganizationSettingsPage from '@/features/organizations/pages/OrganizationSettingsPage';
import ResourceSettingsPage from '@/features/resources/pages/ResourceSettingsPage';
// import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin + "/callback",
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: "openid profile email access:platform"
      }}
    >
      <AuthSetup>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/callback" element={<AuthCallbackPage />} />

            {/* Project Selection */}
            <Route element={<ProtectedRoute><ProjectSelectorLayout /></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/projects" replace />} />
              <Route path="/projects" element={<ProjectListPage />} />
            </Route>

            {/* Project-based Routes */}
            <Route path="/project/:projectId" element={<ProtectedRoute><ProjectLayout /></ProtectedRoute>}>
              <Route index element={<ProjectDetailPage />} />
              <Route path="resources" element={<ResourcesPage />} />
              <Route path="access" element={<ProjectAccessPage />} />
              <Route path="access/grant" element={<CreateRoleAssignmentPage />} />
              <Route path="settings" element={<ProjectSettingsPage />} />
            </Route>

            {/* Resource-based Routes */}
            <Route path="/project/:projectId/resources/:resourceId" element={<ProtectedRoute><ResourceLayout /></ProtectedRoute>}>
              <Route index element={<ResourceDetailPage />} />
              <Route path="access" element={<ResourceAccessPage />} />
              <Route path="access/grant" element={<CreateRoleAssignmentPage />} />
              <Route path="logs" element={<div>Resource Logs Page</div>} />
              <Route path="monitoring" element={<div>Resource Monitoring Page</div>} />
              <Route path="settings" element={<ResourceSettingsPage />} />
            </Route>

            {/* Organization-based Routes */}
            <Route path="/organization/:orgId" element={<ProtectedRoute><OrganizationLayout /></ProtectedRoute>}>
              <Route index element={<OrganizationOverviewPage />} />
              <Route path="members" element={<div>Organization Members Page</div>} />
              <Route path="access" element={<OrganizationAccessPage />} />
              <Route path="access/grant" element={<CreateRoleAssignmentPage />} />
              <Route path="billing" element={<div>Organization Billing Page</div>} />
              <Route path="settings" element={<OrganizationSettingsPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
        {/* <Toaster richColors position="top-right" /> */}
      </AuthSetup>
    </Auth0Provider>
  );
}

export default App;