const SESSION_TOKEN_KEY = 'authToken';
const LEGACY_TOKEN_KEY = 'token';

export function getAuthToken() {
  return sessionStorage.getItem(SESSION_TOKEN_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function clearAuthToken() {
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}
