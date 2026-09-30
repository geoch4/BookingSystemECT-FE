// ─── Shared TypeScript types ──────────────────────────────────────────────────
// This file describes the shape of data in the frontend.
// DTO means "Data Transfer Object" — objects sent between frontend and backend.

// Possible statuses for a booking.
export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled';

// Possible priority levels for a booking.
export type BookingPriority = 'Green' | 'Yellow' | 'Red';
export type AssessmentStatus = 'NotStarted' | 'Incomplete' | 'Complete' | 'NotRequired';
export type IntegrationStatus = 'Manual' | 'PendingSync' | 'Synced' | 'SyncFailed' | 'ExternalOnly';

// TreatmentType mirrors the C# enum in the backend (values 1–7).
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

// BookingDto is booking data coming from the backend.
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
  cancellationReason?: string;
  healthDeclarationStatus?: AssessmentStatus;
  anesthesiaAssessmentStatus?: AssessmentStatus;
  externalPatientId?: string;
  sourceSystem?: string;
  careUnitId?: string;
  regionCode?: string;
  integrationStatus?: IntegrationStatus;
}

// CreateBookingDto is the data the frontend sends to the backend when a booking is created or updated.
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
  cancellationReason?: string;
  healthDeclarationStatus?: AssessmentStatus;
  anesthesiaAssessmentStatus?: AssessmentStatus;
  externalPatientId?: string;
  sourceSystem?: string;
  careUnitId?: string;
  regionCode?: string;
  integrationStatus?: IntegrationStatus;
}

// PatientDto describes a patient coming from the backend.
export interface PatientDto {
  patientId: number;
  fullName: string;
  socialSecurityNumber: string;
  externalPatientId?: string;
  sourceSystem?: string;
  regionCode?: string;
  integrationStatus?: IntegrationStatus;
}

// CreatePatientDto is used when the frontend creates a new patient.
export interface CreatePatientDto {
  fullName: string;
  socialSecurityNumber: string;
  externalPatientId?: string;
  sourceSystem?: string;
  regionCode?: string;
  integrationStatus?: IntegrationStatus;
}

// UserDto describes a user in the system.
export interface UserDto {
  userId: number;
  email: string;
  fullname: string;
  roleId?: number;
  roleName?: string;
  careUnitId?: string;
}

// CreateUserDto is used when a new user is created.
export interface CreateUserDto {
  fullname: string;
  email: string;
  password: string;
  roleId: number;
  careUnitId?: string;
}

// UpdateUserDto is used when a user is updated.
// The fields are optional since only one of them might be changing.
export interface UpdateUserDto {
  fullname?: string;
  email?: string;
  password?: string;
  roleId?: number;
  careUnitId?: string;
}

// LoginDto is sent to the backend when logging in.
export interface LoginDto {
  email: string;
  password: string;
}

// RoleDto describes a role, for example Admin or Nurse.
export interface RoleDto {
  roleId: number;
  roleName: string;
}

// DocumentDto describes a document in the system.
export interface DocumentDto {
  documentId: number;
  fileName: string;
  verified: boolean;
  uploadedByUserId: number;
  title?: string;
  documentType?: string;
  businessArea?: string;
  version?: string;
  owner?: string;
  validFrom?: string;
  validTo?: string;
  externalDocumentId?: string;
  description?: string;
  link?: string;
}

// CreateDocumentDto is used when a document is created.
export interface CreateDocumentDto {
  fileName: string;
  verified: boolean;
  uploadedByUserId: number;
  title?: string;
  documentType?: string;
  businessArea?: string;
  version?: string;
  owner?: string;
  validFrom?: string;
  validTo?: string;
  externalDocumentId?: string;
  description?: string;
  link?: string;
}

// NotificationDto describes a notification.
export interface NotificationDto {
  notificationId: number;
  message: string;
  sentAt: string;
  createdAt?: string;
  recipientId: number;
  isRead: boolean;
}

export type ReferralStatus =
  | 'Draft'
  | 'Submitted'
  | 'NeedsCompletion'
  | 'UnderReview'
  | 'Approved'
  | 'Scheduled'
  | 'Paused'
  | 'Cancelled'
  | 'Completed'
  | 'Rejected'
  | 'NoShow';

export type ReferralActionType = 'CompletionRequested' | 'CompletionSubmitted' | 'Prioritized' | 'TimeConfirmed';

export interface ReferralDto {
  referralId: number;
  bookingId?: number;
  patientId: number;
  treatmentTypeId: TreatmentType;
  department: string;
  contactName?: string;
  contactPhone?: string;
  priority: BookingPriority;
  status: ReferralStatus;
  requestedStartDate?: string;
  createdAt: string;
  updatedAt?: string;
  externalPatientId?: string;
  sourceSystem?: string;
  careUnitId?: string;
  regionCode?: string;
  integrationStatus?: IntegrationStatus;
}

export interface ReferralActionDto {
  referralActionId: number;
  referralId: number;
  actionType: ReferralActionType;
  title: string;
  comment: string;
  priority?: BookingPriority;
  confirmedDateTime?: string;
  createdAt: string;
  createdById?: number;
}

export interface CreateReferralActionDto {
  actionType: ReferralActionType;
  comment: string;
  priority?: BookingPriority;
  confirmedDateTime?: string;
}

export interface ReferralTimelineEventDto {
  title: string;
  detail: string;
  createdAt: string;
  tone: 'info' | 'warning' | 'success' | 'danger';
}

export interface IntegrationCapabilityDto {
  key: string;
  label: string;
  status: string;
  detail: string;
}

export interface IntegrationReadinessDto {
  enabled: boolean;
  regionCode: string;
  sourceSystem: string;
  identityProvider: string;
  journalProvider: string;
  integrationLayer: string;
  allowOutboundPatientData: boolean;
  allowPatientDetailsInExternalNotifications: boolean;
  capabilities: IntegrationCapabilityDto[];
}

// OperationResult is a generic response from the backend.
// T means the data type can vary depending on the API call.
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  errorMessage?: string;
}
