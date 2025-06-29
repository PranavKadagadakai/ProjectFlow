import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth"; // Import from Amplify v6+

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL; // Your Django backend URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach the JWT token
api.interceptors.request.use(
  async (config) => {
    try {
      const { idToken } = (await fetchAuthSession()).tokens ?? {};
      if (idToken) {
        config.headers.Authorization = `Bearer ${idToken.toString()}`;
      }
    } catch (error) {
      console.error("Error getting auth token for API request:", error);
      // It's not safe to use `Maps` directly here.
      // For global navigation on auth token failure, consider:
      // 1. Dispatching a global event/context update that triggers navigation in a component.
      // 2. Handling the 401 error in the response interceptor or the calling component.
      return Promise.reject(error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error("API Error Response:", error.response.data);
      console.error("API Error Status:", error.response.status);
      console.error("API Error Headers:", error.response.headers);

      if (error.response.status === 401) {
        console.warn(
          "Authentication expired or invalid. Please re-authenticate."
        );
        // Do NOT use Navigate here. Instead, let the error propagate,
        // and the component handling the API call can decide to redirect
        // based on the error status (e.g., using a useEffect with a dependency on `isAuthenticated` state).
        // A more advanced solution would be a global "logout" function that invalidates context
        // and navigates, which the interceptor could call.
      } else if (error.response.status === 403) {
        console.warn(
          "Access forbidden. You do not have permission to perform this action."
        );
      }
    } else if (error.request) {
      console.error("No API response received:", error.request);
    } else {
      console.error("Error setting up API request:", error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
