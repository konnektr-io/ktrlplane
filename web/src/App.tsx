import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import MinimalAppLayout from "@/components/MinimalAppLayout";
import ProjectLayout from "@/features/projects/layouts/ProjectLayout";
import ResourceLayout from "@/features/resources/layouts/ResourceLayout";
import OrganizationLayout from "@/features/organizations/layouts/OrganizationLayout";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import ProjectListPage from "@/features/projects/pages/ProjectListPage";
import ResourcesPage from "@/features/resources/pages/ResourcesPage";
import SecretsPage from "@/features/resources/pages/SecretsPage";
import CreateResourcePage from "@/features/resources/pages/CreateResourcePage";
import ResourceDetailPage from "@/features/resources/pages/ResourceDetailPage";
import ResourceAccessPage from "@/features/resources/pages/ResourceAccessPage";
import ProjectDetailPage from "@/features/projects/pages/ProjectDetailPage";
import ProjectAccessPage from "@/features/projects/pages/ProjectAccessPage";
import OrganizationAccessPage from "@/features/organizations/pages/OrganizationAccessPage";
import CreateRoleAssignmentPage from "@/features/access/pages/CreateRoleAssignmentPage";
import AuthCallbackPage from "@/features/auth/callback";
import NotFoundPage from "@/pages/NotFoundPage";
import OrganizationOverviewPage from "@/features/organizations/pages/OrganizationOverviewPage";
import OrganizationSettingsPage from "@/features/organizations/pages/OrganizationSettingsPage";
import OrganizationListPage from "@/features/organizations/pages/OrganizationListPage";
import ResourceSettingsPage from "@/features/resources/pages/ResourceSettingsPage";
import { ResourceLogsPage } from "@/features/resources/pages/ResourceLogsPage";
import { ResourceMonitoringPage } from "@/features/resources/pages/ResourceMonitoringPage";
import BillingPage from "@/features/billing/pages/BillingPage";
import ProjectAutoRedirect from "@/features/projects/components/ProjectAutoRedirect";
import { CookieConsent } from "@/components/cookie-consent";
import { trackAuthentication } from "./utils/analytics";

function App() {
  // Track authentication event after redirect
  const onRedirectCallback = (appState?: { returnTo?: string }) => {
    // Determine if this is sign up or sign in (simple heuristic: check referrer or URL)
    const url = window.location.href;
    const isSignUp =
      url.includes("signup") || document.referrer.includes("signup");
    const method = isSignUp ? "sign_up" : "sign_in";
    // Fire analytics event
    trackAuthentication(method);
    window.location.replace(appState?.returnTo || "/projects");
  };

  // GTM consent logic
  const setConsent = (consent: "accepted" | "declined") => {
    if (typeof window !== "undefined") {
      // Declare window.gtag for TypeScript
      type GtagFn = (
        command: string,
        action: string,
        params: Record<string, string>
      ) => void;
      const gtag = (window as typeof window & { gtag?: GtagFn }).gtag;
      if (gtag) {
        if (consent === "accepted") {
          gtag("consent", "update", {
            ad_storage: "granted",
            analytics_storage: "granted",
          });
        } else {
          gtag("consent", "update", {
            ad_storage: "denied",
            analytics_storage: "denied",
          });
        }
      }
    }
    type ClarityFn = (command: string, params: Record<string, string>) => void;
    const clarity = (window as typeof window & { clarity?: ClarityFn }).clarity;
    if (clarity) {
      if (consent === "accepted") {
        clarity("consentv2", {
          ad_Storage: "granted",
          analytics_Storage: "granted",
        });
      } else {
        clarity("consentv2", {
          ad_Storage: "denied",
          analytics_Storage: "denied",
        });
      }
    }
  };

  const handleAccept = () => {
    setConsent("accepted");
  };
  const handleDecline = () => {
    setConsent("declined");
  };

  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin + "/callback",
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: "openid profile email access:platform",
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
      onRedirectCallback={onRedirectCallback}
    >
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/callback" element={<AuthCallbackPage />} />
          {/* Project Selection: auto-redirect only on root */}
          <Route
            element={
              <ProtectedRoute>
                <MinimalAppLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/"
              element={
                <ProjectAutoRedirect>
                  <ProjectListPage />
                </ProjectAutoRedirect>
              }
            />
            <Route path="/projects" element={<ProjectListPage />} />
            <Route path="/organizations" element={<OrganizationListPage />} />
          </Route>

          {/* Project-based Routes (plural) */}
          <Route
            path="/projects/:projectId"
            element={
              <ProtectedRoute>
                <ProjectLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ProjectDetailPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="secrets" element={<SecretsPage />} />
            <Route path="resources/create" element={<CreateResourcePage />} />
            <Route path="access" element={<ProjectAccessPage />} />
            <Route path="access/grant" element={<CreateRoleAssignmentPage />} />
            <Route path="billing" element={<BillingPage />} />
          </Route>

          {/* Global resource creation route for homepage integration */}
          <Route
            element={
              <ProtectedRoute>
                <MinimalAppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/resources/create" element={<CreateResourcePage />} />
          </Route>

          {/* Resource-based Routes (plural) */}
          <Route
            path="/projects/:projectId/resources/:resourceId"
            element={
              <ProtectedRoute>
                <ResourceLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ResourceDetailPage />} />
            <Route path="access" element={<ResourceAccessPage />} />
            <Route path="access/grant" element={<CreateRoleAssignmentPage />} />
            <Route path="logs" element={<ResourceLogsPage />} />
            <Route path="monitoring" element={<ResourceMonitoringPage />} />
            <Route path="settings" element={<ResourceSettingsPage />} />
          </Route>

          {/* Organization-based Routes (plural) */}
          <Route
            path="/organizations/:orgId"
            element={
              <ProtectedRoute>
                <OrganizationLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OrganizationOverviewPage />} />
            <Route path="projects" element={<ProjectListPage />} />
            <Route path="access" element={<OrganizationAccessPage />} />
            <Route path="access/grant" element={<CreateRoleAssignmentPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="settings" element={<OrganizationSettingsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
      {/* Cookie Consent Popup */}
      <CookieConsent
        variant="minimal"
        onAcceptCallback={handleAccept}
        onDeclineCallback={handleDecline}
      />
      {/* <Toaster richColors position="top-right" /> */}
    </Auth0Provider>
  );
}

export default App;
