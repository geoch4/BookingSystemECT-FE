import client from './client';
import type { PatientDto, CreatePatientDto } from '../types';

// ─── Patient API ──────────────────────────────────────────────────────────────
// Den här filen samlar API-anrop som gäller patienter.

// Hämtar alla patienter.
export const getPatients = () =>
  client.get<PatientDto[]>('/patients').then((r) => r.data);

// Hämtar en patient med ett specifikt patientId.
export const getPatientById = (id: number) =>
  client.get<PatientDto>(`/patients/${id}`).then((r) => r.data);

// Skapar en ny patient.
// dto innehåller namn och personnummer.
export const createPatient = (dto: CreatePatientDto) =>
  client.post<PatientDto>('/patients', dto).then((r) => r.data);

// Uppdaterar en befintlig patient.
export const updatePatient = (id: number, dto: CreatePatientDto) =>
  client.put(`/patients/${id}`, dto);

// Raderar en patient.
export const deletePatient = (id: number) =>
  client.delete(`/patients/${id}`);
