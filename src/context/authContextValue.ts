import { createContext } from 'react';
import type { AppRole, Permission } from '../utils/permissions';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  careUnitId?: string;
  expiresAt: number;
}

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  appRole: AppRole | null;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
