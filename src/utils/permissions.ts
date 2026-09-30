import type { PortalMode } from '../config/portal';

export type Permission =
  | 'viewDepartmentPortal'
  | 'viewTreatmentPortal'
  | 'viewDailyList'
  | 'viewReferralQueue'
  | 'viewCalendar'
  | 'viewDocuments'
  | 'viewStatistics'
  | 'createReferral'
  | 'viewOwnPatients'
  | 'viewConfirmedTimes'
  | 'setDepartmentPriority'
  | 'requestCompletion'
  | 'prioritizeReferral'
  | 'confirmElvisBooking'
  | 'manageClinicalDecision'
  | 'manageUsers'
  | 'manageSettings'
  | 'viewAuditLog';

export type AppRole =
  | 'department'
  | 'treatment-unit'
  | 'medical-responsible'
  | 'admin';

const rolePermissions: Record<AppRole, Permission[]> = {
  department: [
    'viewDepartmentPortal',
    'createReferral',
    'viewOwnPatients',
    'viewConfirmedTimes',
    'setDepartmentPriority',
  ],
  'treatment-unit': [
    'viewTreatmentPortal',
    'viewDailyList',
    'viewReferralQueue',
    'requestCompletion',
    'confirmElvisBooking',
  ],
  'medical-responsible': [
    'viewTreatmentPortal',
    'viewDailyList',
    'viewReferralQueue',
    'requestCompletion',
    'prioritizeReferral',
    'confirmElvisBooking',
    'manageClinicalDecision',
  ],
  admin: [
    'viewTreatmentPortal',
    'viewDailyList',
    'viewCalendar',
    'viewDocuments',
    'viewStatistics',
    'manageUsers',
    'manageSettings',
    'viewAuditLog',
  ],
};

export function getAppRole(role?: string): AppRole {
  const normalized = role?.trim().toLowerCase() ?? '';

  if (normalized.includes('admin') || normalized.includes('administrat')) {
    return 'admin';
  }

  if (
    normalized.includes('avdelning')
    || normalized.includes('mottagning')
    || normalized.includes('vårdcentral')
    || normalized.includes('vardcentral')
    || normalized.includes('department')
    || normalized.includes('ward')
    || normalized.includes('clinic')
  ) {
    return 'department';
  }

  if (
    normalized.includes('medicinskt ansvarig')
    || normalized.includes('överläk')
    || normalized.includes('overlak')
    || normalized.includes('underläk')
    || normalized.includes('underlak')
    || normalized.includes('specialistläk')
    || normalized.includes('specialistlak')
    || normalized.includes('läkare')
    || normalized.includes('lakare')
    || normalized.includes('doctor')
  ) {
    return 'medical-responsible';
  }

  if (
    normalized.includes('behandlingsenhet')
    || normalized.includes('ect')
    || normalized.includes('rtms')
    || normalized.includes('koordinator')
    || normalized.includes('coordinator')
    || normalized.includes('narkos')
    || normalized.includes('anestesi')
  ) {
    return 'treatment-unit';
  }

  return 'department';
}

export function hasPermission(role: string | undefined, permission: Permission) {
  return rolePermissions[getAppRole(role)].includes(permission);
}

export function hasAnyPermission(role: string | undefined, permissions: Permission[]) {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function getAllowedPortalByPermissions(role?: string): PortalMode {
  return hasPermission(role, 'viewTreatmentPortal') ? 'admin' : 'department';
}

export function roleDisplayName(role?: string) {
  const appRole = getAppRole(role);

  if (appRole === 'admin') return 'Administratör';
  if (appRole === 'medical-responsible') return 'Medicinskt ansvarig';
  if (appRole === 'treatment-unit') return 'Behandlingsenhet';
  return 'Avdelning';
}
