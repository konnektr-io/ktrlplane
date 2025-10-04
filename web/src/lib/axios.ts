// Extend Window interface for TypeScript
declare global {
  interface Window {
    auth0Logout?: () => void;
  }
}
import axios from 'axios';

const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL || window.location.origin + "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper to get Auth0 logout method
// function getAuth0Logout() {
  // Try to get the Auth0 logout method from window
//   return window.auth0Logout || (() => { window.location.href = '/login'; });
// }

// Function to setup auth interceptor with Auth0 token
export const setupAuthInterceptor = (
  getAccessTokenSilently: () => Promise<string>,
  getAccessTokenWithPopup: () => Promise<string>
) => {
  // Clear any existing auth interceptors
  apiClient.interceptors.request.clear();

  // Add new auth interceptor
  apiClient.interceptors.request.use(
    async (config) => {
      try {
        let token = await getAccessTokenSilently();
        if (!token) {
          // If token cannot be retrieved, try with popup as fallback
          token = await getAccessTokenWithPopup();
        }
        if (!token) {
          // If token cannot be retrieved throw error
          throw new Error("Could not retrieve token");
        }
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.warn("Failed to get access token:", error);
        // getAuth0Logout()();
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
