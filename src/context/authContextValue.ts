import { createContext } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
