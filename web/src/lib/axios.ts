import axios from "axios";

const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL || window.location.origin + "/api/v1",
});

// No global interceptor; token must be passed per request.

export default apiClient;
