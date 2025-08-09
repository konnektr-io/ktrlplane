import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import AuthSetup from '@/features/auth/AuthSetup';
import ProjectSelectorLayout from '@/components/ProjectSelectorLayout';
import ProjectLayout from '@/components/ProjectLayout';
import ProjectListPage from '@/features/projects/pages/ProjectListPage';
import ResourcesPage from '@/features/resources/pages/ResourcesPage';
import ResourceDetailPage from '@/features/resources/pages/ResourceDetailPage';
import ProjectSettingsPage from '@/features/projects/pages/ProjectSettingsPage';
import LoginPage from '@/features/auth/LoginPage';
import AuthCallbackPage from '@/features/auth/callback';
import ProtectedRoute from '@/features/auth/ProtectedRoute';
import NotFoundPage from '@/pages/NotFoundPage';
import { Toaster } from "@/components/ui/sonner";

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
              <Route index element={<Navigate to="resources" replace />} />
              <Route path="resources" element={<ResourcesPage />} />
              <Route path="resources/:resourceId" element={<ResourceDetailPage />} />
              <Route path="settings" element={<ProjectSettingsPage />} />
            </Route>

            {/* Not Found */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
        <Toaster richColors position="top-right" />
      </AuthSetup>
    </Auth0Provider>
  );
}

export default App;