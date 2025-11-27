import axios from "axios";
// Prevent multiple redirects and request storms
let isRedirecting = false;

const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL || window.location.origin + "/api/v1",
});

// Helper to get Auth0 logout method
// function getAuth0Logout() {
// Try to get the Auth0 logout method from window
//   return window.auth0Logout || (() => { window.location.href = '/login'; });
// }

// Function to setup auth interceptor with Auth0 token
export const setupAuthInterceptor = (
  getAccessTokenSilently: () => Promise<string>,
  loginWithRedirect: () => Promise<void>
) => {
  // Clear any existing auth interceptors
  apiClient.interceptors.request.clear();

  apiClient.interceptors.request.use(
    async (config) => {
      if (isRedirecting) {
        // Block further requests while redirecting
        return Promise.reject(new Error("Redirecting to login"));
      }
      try {
        const token = await getAccessTokenSilently();
        if (!token) {
          isRedirecting = true;
          await loginWithRedirect();
          throw new Error("Could not retrieve token after login redirect");
        }
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.warn("Failed to get access token:", error);
        if (!isRedirecting) {
          isRedirecting = true;
          await loginWithRedirect();
        }
        return Promise.reject(error);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

// Response interceptor for error handling
/* apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Prevent redirect loop if already on /login or /callback
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/callback') {
        getAuth0Logout()();
      }
    }
    return Promise.reject(error);
  }
); */

export default apiClient;
