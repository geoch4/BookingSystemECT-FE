import client from './client';
import type { LoginDto, CreateUserDto, OperationResult } from '../types';

// ─── Auth API ─────────────────────────────────────────────────────────────────
// Den här filen innehåller API-anrop för inloggning och registrering.

// Loggar in användaren.
// Backend returnerar en token om e-post och lösenord stämmer.
export async function login(dto: LoginDto): Promise<OperationResult<string>> {
  const res = await client.post<OperationResult<string>>('/auth/login', dto);
  return res.data;
}

// Registrerar en ny användare.
// Används när admin skapar konto eller när registreringsflödet tillåts.
export async function register(dto: CreateUserDto): Promise<OperationResult<number>> {
  const res = await client.post<OperationResult<number>>('/auth/register', dto);
  return res.data;
}
