// FrontEnd/src/api/api.js
import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth"; // Import from Amplify v6+
import { Navigate } from "react-router-dom";

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
      // Correctly gets the ID token using the modern fetchAuthSession function [cite: 50]
      const { idToken } = (await fetchAuthSession()).tokens ?? {};
      if (idToken) {
        // The token is an object, convert it to a string [cite: 53]
        config.headers.Authorization = `Bearer ${idToken.toString()}`;
      }
    } catch (error) {
      console.error("Error getting auth token for API request:", error);
      // Optionally, handle token acquisition errors (e.g., redirect to login)
      Navigate("/login"); // Redirect to login if token acquisition fails
      return Promise.reject(error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling (optional)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("API Error Response:", error.response.data);
      console.error("API Error Status:", error.response.status);
      console.error("API Error Headers:", error.response.headers);

      // Specific error handling based on status codes
      if (error.response.status === 401) {
        // Unauthorized - token expired or invalid
        console.warn(
          "Authentication expired or invalid. Please re-authenticate."
        );
        // You might want to trigger a signOut or redirect to login here
        Navigate("/login"); // Redirect to login if unauthorized
      } else if (error.response.status === 403) {
        // Forbidden - user does not have necessary permissions
        console.warn(
          "Access forbidden. You do not have permission to perform this action."
        );
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No API response received:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error setting up API request:", error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
