// ─── Gemensamma TypeScript-typer ──────────────────────────────────────────────
// Den här filen beskriver vilken form data har i frontend.
// DTO betyder "Data Transfer Object" och är objekt som skickas mellan frontend och backend.

// Möjliga statusar för en bokning.
export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled';

// Möjliga prioriteringsnivåer för en bokning.
export type BookingPriority = 'Green' | 'Yellow' | 'Red';

// TreatmentType speglar C#-enumen i backend (värden 1–7).
export type TreatmentType = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const TREATMENT_TYPE_LABELS: Record<TreatmentType, string> = {
  1: 'ECT - akut',
  2: 'ECT - planerad',
  3: 'ECT - underhåll',
  4: 'ECT - indexserie',
  5: 'rTMS - depression',
  6: 'rTMS - ångest/OCD',
  7: 'rTMS - underhåll',
};

export const TREATMENT_TYPE_OPTIONS = Object.entries(TREATMENT_TYPE_LABELS).map(
  ([v, label]) => ({ value: Number(v) as TreatmentType, label }),
);

export function isEctType(t: number): boolean { return t >= 1 && t <= 4; }
export function isRtmsType(t: number): boolean { return t >= 5 && t <= 7; }

// BookingDto är bokningsdata som kommer från backend.
export interface BookingDto {
  bookingId: number;
  date: string;
  patientId: number;
  treatmentTypeId: TreatmentType;
  createdById: number;
  createdAt: string;
  priority: BookingPriority;
  status: BookingStatus;
  referralDepartment?: string;
  referralContactName?: string;
  referralContactPhone?: string;
}

// CreateBookingDto är datan frontend skickar till backend när en bokning skapas eller uppdateras.
export interface CreateBookingDto {
  date: string;
  patientId: number;
  treatmentTypeId: TreatmentType;
  createdById: number;
  createdAt: string;
  priority: BookingPriority;
  status: BookingStatus;
  referralDepartment?: string;
  referralContactName?: string;
  referralContactPhone?: string;
}

// PatientDto beskriver en patient som kommer från backend.
export interface PatientDto {
  patientId: number;
  fullName: string;
  socialSecurityNumber: string;
}

// CreatePatientDto används när frontend skapar en ny patient.
export interface CreatePatientDto {
  fullName: string;
  socialSecurityNumber: string;
}

// UserDto beskriver en användare i systemet.
export interface UserDto {
  userId: number;
  email: string;
  fullname: string;
  roleName?: string;
}

// CreateUserDto används när en ny användare skapas.
export interface CreateUserDto {
  fullname: string;
  email: string;
  password: string;
  roleId: number;
}

// UpdateUserDto används när en användare uppdateras.
// Fälten är optional eftersom man kanske bara ändrar ett av dem.
export interface UpdateUserDto {
  fullname?: string;
  email?: string;
  password?: string;
}

// LoginDto skickas till backend vid inloggning.
export interface LoginDto {
  email: string;
  password: string;
}

// RoleDto beskriver en roll, till exempel Admin eller Sjuksköterska.
export interface RoleDto {
  roleId: number;
  roleName: string;
}

// DocumentDto beskriver ett dokument i systemet.
export interface DocumentDto {
  documentId: number;
  fileName: string;
  verified: boolean;
  uploadedByUserId: number;
}

// CreateDocumentDto används när ett dokument skapas.
export interface CreateDocumentDto {
  fileName: string;
  verified: boolean;
  uploadedByUserId: number;
}

// NotificationDto beskriver en notis.
export interface NotificationDto {
  notificationId: number;
  message: string;
  createdAt: string;
  isRead: boolean;
}

// OperationResult är ett generiskt svar från backend.
// T betyder att data kan vara olika typ beroende på API-anrop.
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  errorMessage?: string;
}
