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
  | 'recordPatientAction'
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
  | 'admin'
  | 'unknown';

const rolePermissions: Record<AppRole, Permission[]> = {
  unknown: [],
  department: [
    'viewDepartmentPortal',
    'createReferral',
    'viewOwnPatients',
    'viewConfirmedTimes',
    'setDepartmentPriority',
    'recordPatientAction',
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
    'viewReferralQueue',
    'viewCalendar',
    'viewDocuments',
    'viewStatistics',
    'requestCompletion',
    'prioritizeReferral',
    'confirmElvisBooking',
    'manageClinicalDecision',
    'manageUsers',
    'manageSettings',
    'viewAuditLog',
  ],
};

// Exact aliases must match the backend role catalog. Unknown roles grant nothing.
const roleAliases: Record<string, AppRole> = {
  admin: 'admin',
  avdelning: 'department', 'remitterande avdelning': 'department',
  vårdavdelning: 'department', mottagning: 'department',
  'medicinskt ansvarig': 'medical-responsible', överläkare: 'medical-responsible',
  underläkare: 'medical-responsible', läkare: 'medical-responsible',
  ectsjuksköterska: 'treatment-unit', 'ect-koordinator': 'treatment-unit',
  behandlingsenhet: 'treatment-unit', 'treatment unit': 'treatment-unit',
};

export function getAppRole(role?: string): AppRole {
  return roleAliases[role?.trim().toLowerCase() ?? ''] ?? 'unknown';
}

export function hasPermission(role: string | undefined, permission: Permission) {
  return rolePermissions[getAppRole(role)].includes(permission);
}

export function hasAnyPermission(role: string | undefined, permissions: Permission[]) {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function getPermissionsForAppRole(appRole: AppRole) {
  return [...rolePermissions[appRole]];
}

export function getPermissionsForRole(role?: string) {
  return getPermissionsForAppRole(getAppRole(role));
}

export function getAllowedPortalByPermissions(role?: string): PortalMode {
  return hasPermission(role, 'viewTreatmentPortal') ? 'admin' : 'department';
}

export function roleDisplayName(role?: string) {
  const appRole = getAppRole(role);

  if (appRole === 'admin') return 'Administratör';
  if (appRole === 'medical-responsible') return 'Medicinskt ansvarig';
  if (appRole === 'treatment-unit') return 'Behandlingsenhet';
  return appRole === 'department' ? 'Avdelning' : 'Ingen behörighet';
}
