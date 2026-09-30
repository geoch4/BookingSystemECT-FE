import client from './client';
import type { RoleDto } from '../types';

// ─── Role API ─────────────────────────────────────────────────────────────────
// This file handles roles, for example Admin or Nurse.

// The type used to create or update a role.
interface CreateRoleDto { roleName: string; }

// Fetches all roles.
export const getRoles = () =>
  client.get<RoleDto[]>('/role').then((r) => r.data);

// Creates a new role.
export const createRole = (dto: CreateRoleDto) =>
  client.post<RoleDto>('/role', dto).then((r) => r.data);

// Updates a role by a specific roleId.
export const updateRole = (id: number, dto: CreateRoleDto) =>
  client.put(`/role/${id}`, dto);

// Deletes a role.
export const deleteRole = (id: number) =>
  client.delete(`/role/${id}`);
