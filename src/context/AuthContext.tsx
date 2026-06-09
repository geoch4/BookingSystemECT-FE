import { useState, useCallback, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { clearAuthToken, getAuthToken, setAuthToken } from '../utils/authToken';
import { AuthContext, type AuthUser } from './authContextValue';

interface JwtPayload {
  sub: string;
  email: string;
  name?: string;
  role?: string;
  exp: number;
}

function parseToken(token: string): AuthUser | null {
  try {
    const payload = jwtDecode<JwtPayload>(token);
    if (payload.exp * 1000 <= Date.now()) return null;

    return {
      id: payload.sub,
      email: payload.email ?? '',
      name: payload.name ?? payload.email ?? '',
      role: payload.role ?? '',
    };
  } catch {
    return null;
  }
}

function getStoredAuth() {
  const storedToken = getAuthToken();
  const storedUser = storedToken ? parseToken(storedToken) : null;

  if (storedToken && !storedUser) clearAuthToken();

  return {
    token: storedUser ? storedToken : null,
    user: storedUser,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState(getStoredAuth);

  const login = useCallback((newToken: string) => {
    const nextUser = parseToken(newToken);

    if (!nextUser) {
      clearAuthToken();
      setAuth({ token: null, user: null });
      return;
    }

    setAuthToken(newToken);
    setAuth({ token: newToken, user: nextUser });
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setAuth({ token: null, user: null });
  }, []);

  const isAdmin = auth.user?.role?.toLowerCase() === 'admin';

  return (
    <AuthContext.Provider value={{ user: auth.user, token: auth.token, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}
