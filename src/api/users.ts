import client from './client';
import type { UserDto, UpdateUserDto } from '../types';

// ─── User API ─────────────────────────────────────────────────────────────────
// This file handles users in the system.

// Fetches all users.
export const getUsers = () =>
  client.get<UserDto[]>('/user').then((r) => r.data);

// Fetches a user by a specific userId.
export const getUserById = (id: number) =>
  client.get<UserDto>(`/user/${id}`).then((r) => r.data);

// Updates a user's details.
export const updateUser = (id: number, dto: UpdateUserDto) =>
  client.put(`/user/${id}`, dto);

// Deletes a user.
export const deleteUser = (id: number) =>
  client.delete(`/user/${id}`);
