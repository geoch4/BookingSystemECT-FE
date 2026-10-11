import { jwtDecode } from 'jwt-decode';
import { getAuthToken } from './authToken';
import { getAppRole } from './permissions';
type ScopeUser = { role?: string; careUnitId?: string };
type ScopedResource = { careUnitId?: string; referralDepartment?: string; departmentId?: string; treatmentUnitId?: string };
export function canAccessResource(user: ScopeUser | null, resource: ScopedResource) {
  if (!user || getAppRole(user.role) === 'unknown') return false;
  if (getAppRole(user.role) === 'admin') return true;
  const unit = user.careUnitId;
  const resourceUnit = getAppRole(user.role) === 'department'
    ? resource.departmentId ?? resource.careUnitId ?? resource.referralDepartment
    : resource.treatmentUnitId;
  return !!unit?.trim() && !!resourceUnit?.trim() && unit.toLowerCase() === resourceUnit.toLowerCase();
}
export function currentScopeUser(): ScopeUser | null {
  try {
    const token = getAuthToken();
    if (!token) return null;
    const claims = jwtDecode<{role?: string; care_unit?: string; exp?: number; 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string}>(token);
    if (!claims.exp || !Number.isFinite(claims.exp) || claims.exp * 1000 <= Date.now()) return null;
    return {role: claims.role ?? claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'], careUnitId: claims.care_unit};
  } catch { return null; }
}
