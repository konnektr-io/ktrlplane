import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to setup auth interceptor with Auth0 token
export const setupAuthInterceptor = (getAccessTokenSilently: () => Promise<string>) => {
  // Clear any existing auth interceptors
  apiClient.interceptors.request.clear();
  
  // Add new auth interceptor
  apiClient.interceptors.request.use(
    async (config) => {
      try {
        const token = await getAccessTokenSilently();
        if (!token) {
          throw new Error('Could not retrieve token')
        }
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.warn('Failed to get access token:', error);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access - redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
