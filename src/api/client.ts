import axios from 'axios';
import { clearAuthToken, getAuthToken } from '../utils/authToken';

// ─── Shared API client ────────────────────────────────────────────────────────
// This axios client is used by every file in src/api.
// That way we avoid repeating the backend address and headers in every API file.

// In production this can point to the backend directly. In local dev, '/api'
// goes through the Vite proxy.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

const client = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor runs before every API request is sent.
client.interceptors.request.use((config) => {
  // Get the JWT token if the user is logged in.
  const token = getAuthToken();

  // If a token exists, attach it to the Authorization header.
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Return the config so axios can continue with the request.
  return config;
});

// Response interceptor runs after the backend has responded.
client.interceptors.response.use(
  // If the response is OK, return it as-is.
  (res) => res,

  // If the backend returns an error, handle it here.
  (err) => {
    if (import.meta.env.DEV && err.response) {
      console.error('[API ERROR]', err.config?.method?.toUpperCase(), err.config?.url, err.response.status);
      console.error('[API ERROR body]', JSON.stringify(err.response.data, null, 2));
    }
    // 401 means the user is no longer authorized/logged in.
    // Exception: login/register requests should NOT trigger a redirect, since
    // a failed login attempt (wrong password) also returns 401.
    const url = err.config?.url ?? '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');

    if (err.response?.status === 401 && !isAuthEndpoint) {
      // Remove the token since it no longer works.
      clearAuthToken();

      // Send the user back to the login page.
      window.location.href = '/login';
    }

    if (err.response?.status === 403 && !isAuthEndpoint && window.location.pathname !== '/403') {
      window.location.assign('/403');
    }

    // Re-throw the error so the page that made the request can show an error message.
    return Promise.reject(err);
  }
);

// Export the client so other API files can reuse it.
export default client;
