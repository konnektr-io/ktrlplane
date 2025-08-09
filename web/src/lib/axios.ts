import axios from 'axios';
import { useAuthStore } from '@/store/authStore'; // Assuming authStore handles tokens

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1', // Use env var
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token; // Get token from Zustand store
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add response interceptor for error handling (e.g., redirect on 401)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access, e.g., clear token, redirect to login
      useAuthStore.getState().logout(); // Example logout action
      console.error('Unauthorized access - logging out.');
      // window.location.href = '/login'; // Or use react-router navigate
    }
    // You might want to show a toast notification here for other errors
    return Promise.reject(error);
  }
);


export default apiClient;