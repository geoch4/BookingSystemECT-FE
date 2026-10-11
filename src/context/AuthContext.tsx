import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { jwtDecode } from 'jwt-decode';
import { clearAuthToken, getAuthToken, setAuthToken } from '../utils/authToken';
import { AuthContext, type AuthUser } from './authContextValue';
import { logout as logoutOnServer } from '../api/auth';
import {
  getAppRole,
  hasAnyPermission as roleHasAnyPermission,
  hasPermission as roleHasPermission,
  type Permission,
} from '../utils/permissions';

interface JwtPayload {
  sub: string;
  email?: string;
  name?: string;
  role?: string | string[];
  care_unit?: string;
  exp: number;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'?: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'?: string;
}

const NAME_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const EMAIL_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';

function parseToken(token: string): AuthUser | null {
  try {
    const payload = jwtDecode<JwtPayload>(token);
    const expiresAt = payload.exp * 1000;
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now() || !payload.sub) return null;

    const email = payload.email ?? payload[EMAIL_CLAIM] ?? '';
    const name = payload.name ?? payload[NAME_CLAIM] ?? email;
    const rawRole = payload.role ?? payload[ROLE_CLAIM] ?? '';
    const role = Array.isArray(rawRole) ? rawRole.join(', ') : rawRole;

    return {
      id: payload.sub,
      email,
      name,
      role,
      careUnitId: payload.care_unit,
      expiresAt,
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
  const queryClient = useQueryClient();
  const [auth, setAuth] = useState(getStoredAuth);

  const login = useCallback((newToken: string) => {
    queryClient.clear();
    const nextUser = parseToken(newToken);

    if (!nextUser) {
      clearAuthToken();
      setAuth({ token: null, user: null });
      return;
    }

    setAuthToken(newToken);
    setAuth({ token: newToken, user: nextUser });
  }, [queryClient]);

  const clearSession = useCallback(() => {
    queryClient.clear();
    clearAuthToken();
    setAuth({ token: null, user: null });
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      await logoutOnServer();
      clearSession();
    } catch {
      window.alert('Utloggningen kunde inte bekräftas av servern. Försök igen.');
    }
  }, [clearSession]);

  useEffect(() => {
    if (!auth.user) return undefined;

    const millisecondsUntilExpiry = auth.user.expiresAt - Date.now();
    const timeoutId = window.setTimeout(clearSession, Math.max(0, millisecondsUntilExpiry));
    return () => window.clearTimeout(timeoutId);
  }, [auth.user, clearSession]);

  const appRole = auth.user ? getAppRole(auth.user.role) : null;
  const hasPermission = useCallback((permission: Permission) => {
    return roleHasPermission(auth.user?.role, permission);
  }, [auth.user?.role]);
  const hasAnyPermission = useCallback((permissions: Permission[]) => {
    return roleHasAnyPermission(auth.user?.role, permissions);
  }, [auth.user?.role]);
  const isAdmin = hasPermission('manageUsers') || hasPermission('manageSettings');

  return (
    <AuthContext.Provider
      value={{
        user: auth.user,
        token: auth.token,
        login,
        logout,
        appRole,
        hasPermission,
        hasAnyPermission,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
