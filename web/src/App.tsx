import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import ProjectSelectorLayout from '@/components/ProjectSelectorLayout';
import ProjectLayout from '@/components/ProjectLayout';
import ProjectListPage from '@/features/projects/pages/ProjectListPage';
import ResourcesPage from '@/features/resources/pages/ResourcesPage';
import ResourceDetailPage from '@/features/resources/pages/ResourceDetailPage';
import ProjectSettingsPage from '@/features/projects/pages/ProjectSettingsPage';
import LoginPage from '@/features/auth/LoginPage';
import AuthCallbackPage from '@/features/auth/callback';
import NotFoundPage from '@/pages/NotFoundPage';
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/callback" element={<AuthCallbackPage />} />

          {/* Project Selection */}
          <Route element={<ProjectSelectorLayout />}>
            <Route path="/" element={<Navigate to="/projects" replace />} />
            <Route path="/projects" element={<ProjectListPage />} />
          </Route>

          {/* Project-based Routes */}
          <Route path="/project/:projectId" element={<ProjectLayout />}>
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
    </>
  );
}

export default App;