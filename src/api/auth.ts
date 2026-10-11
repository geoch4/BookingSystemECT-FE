import client from './client';
import type { LoginDto, CreateUserDto, OperationResult } from '../types';

// Ends every existing session for this account, including copied tokens.
export async function logout(): Promise<void> {
  try {
    await client.post('/auth/logout');
  } catch (error) {
    if ((error as { response?: { status?: number } }).response?.status !== 401) throw error;
  }
}

// ─── Auth API ─────────────────────────────────────────────────────────────────
// This file contains API requests for logging in and registering.

// Logs the user in.
// The backend returns a token if the email and password are correct.
export async function login(dto: LoginDto): Promise<OperationResult<string>> {
  const res = await client.post<OperationResult<string>>('/auth/login', dto);
  return res.data;
}

// Registers a new user.
// Used when an admin creates an account or when self-registration is allowed.
export async function register(dto: CreateUserDto): Promise<OperationResult<number>> {
  const res = await client.post<OperationResult<number>>('/auth/register', dto);
  return res.data;
}
