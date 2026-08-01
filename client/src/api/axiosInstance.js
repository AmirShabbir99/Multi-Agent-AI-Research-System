import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'researchmind_token';

// Single stateless JWT, kept in localStorage so it survives page reloads.
// There is no refresh token and no refresh endpoint - when this token expires,
// the user simply logs in again.
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

let onUnauthorized = () => {};
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 90000, // research-mode /ask can genuinely take a while (multi-agent pipeline)
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, config } = error;

    if (!response) {
      return Promise.reject(new Error('Network error - could not reach the server.'));
    }

    const isAuthRoute = config.url?.includes('/auth/');
    if (response.status === 401 && !isAuthRoute) {
      // Token is missing/invalid/expired - there's no refresh to attempt, so
      // clear it and let the app redirect to /login.
      setToken(null);
      onUnauthorized();
    }

    return Promise.reject(error);
  }
);

export default api;
