import client from './client';
import type { UserDto, UpdateUserDto } from '../types';

// ─── User API ─────────────────────────────────────────────────────────────────
// Den här filen hanterar användare i systemet.

// Hämtar alla användare.
export const getUsers = () =>
  client.get<UserDto[]>('/user').then((r) => r.data);

// Hämtar en användare med ett specifikt userId.
export const getUserById = (id: number) =>
  client.get<UserDto>(`/user/${id}`).then((r) => r.data);

// Uppdaterar en användares uppgifter.
export const updateUser = (id: number, dto: UpdateUserDto) =>
  client.put(`/user/${id}`, dto);

// Raderar en användare.
export const deleteUser = (id: number) =>
  client.delete(`/user/${id}`);
