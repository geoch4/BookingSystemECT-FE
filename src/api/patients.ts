import client from './client';
import type { PatientDto, CreatePatientDto } from '../types';

// ─── Patient API ──────────────────────────────────────────────────────────────
// This file collects API requests related to patients.

// Fetches all patients.
export const getPatients = () =>
  client.get<PatientDto[]>('/patients').then((r) => r.data.map(normalizePatient));

// Fetches a patient by a specific patientId.
export const getPatientById = (id: number) =>
  client.get<PatientDto>(`/patients/${id}`).then((r) => normalizePatient(r.data));

// Creates a new patient.
// dto contains name and national ID number.
export const createPatient = (dto: CreatePatientDto) =>
  client.post<PatientDto>('/patients', normalizePatientPayload(dto)).then((r) => normalizePatient(r.data));

// Updates an existing patient.
export const updatePatient = (id: number, dto: CreatePatientDto) =>
  client.put(`/patients/${id}`, normalizePatientPayload(dto));

// Deletes a patient.
export const deletePatient = (id: number) =>
  client.delete(`/patients/${id}`);

function normalizePatient(patient: PatientDto): PatientDto {
  return {
    ...patient,
    sourceSystem: patient.sourceSystem ?? 'Manual',
    integrationStatus: patient.integrationStatus ?? 'Manual',
  };
}

function normalizePatientPayload(dto: CreatePatientDto): CreatePatientDto {
  return {
    ...dto,
    sourceSystem: dto.sourceSystem ?? 'Manual',
    integrationStatus: dto.integrationStatus ?? 'Manual',
  };
}
