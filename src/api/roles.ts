import client from './client';
import type { RoleDto } from '../types';

// ─── Role API ─────────────────────────────────────────────────────────────────
// Den här filen hanterar roller, till exempel Admin eller Sjuksköterska.

// Typen för att skapa eller uppdatera en roll.
interface CreateRoleDto { roleName: string; }

// Hämtar alla roller.
export const getRoles = () =>
  client.get<RoleDto[]>('/role').then((r) => r.data);

// Skapar en ny roll.
export const createRole = (dto: CreateRoleDto) =>
  client.post<RoleDto>('/role', dto).then((r) => r.data);

// Uppdaterar en roll med ett specifikt roleId.
export const updateRole = (id: number, dto: CreateRoleDto) =>
  client.put(`/role/${id}`, dto);

// Raderar en roll.
export const deleteRole = (id: number) =>
  client.delete(`/role/${id}`);
