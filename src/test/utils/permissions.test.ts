import { describe, expect, it } from 'vitest';
import { getAllowedPortalByPermissions, getAppRole, hasPermission } from '../../utils/permissions';

describe('permissions', () => {
  it.each([undefined, '', 'unknown', 'superadmin', 'not-admin', 'doctor', 'Admin, Avdelning'])('denies unrecognized role %s', role => {
    expect(getAppRole(role)).toBe('unknown');
    expect(hasPermission(role, 'manageUsers')).toBe(false);
    expect(hasPermission(role, 'createReferral')).toBe(false);
  });
  it('separates clinical prioritization from booking confirmation', () => {
    expect(hasPermission('Behandlingsenhet', 'prioritizeReferral')).toBe(false);
    expect(hasPermission('Medicinskt ansvarig', 'prioritizeReferral')).toBe(true);
  });
  it('treats Admin as both system admin and treatment portal user', () => {
    expect(getAppRole('Admin')).toBe('admin');
    expect(getAllowedPortalByPermissions('Admin')).toBe('admin');

    expect(hasPermission('Admin', 'viewReferralQueue')).toBe(true);
    expect(hasPermission('Admin', 'confirmElvisBooking')).toBe(true);
    expect(hasPermission('Admin', 'manageUsers')).toBe(true);
    expect(hasPermission('Admin', 'viewAuditLog')).toBe(true);
  });

  it('keeps department users in the department portal without treatment unit permissions', () => {
    expect(getAppRole('Avdelning')).toBe('department');
    expect(getAllowedPortalByPermissions('Avdelning')).toBe('department');

    expect(hasPermission('Avdelning', 'createReferral')).toBe(true);
    expect(hasPermission('Avdelning', 'setDepartmentPriority')).toBe(true);
    expect(hasPermission('Avdelning', 'recordPatientAction')).toBe(true);
    expect(hasPermission('Avdelning', 'viewReferralQueue')).toBe(false);
    expect(hasPermission('Avdelning', 'confirmElvisBooking')).toBe(false);
  });

  it('lets treatment unit staff handle referrals without system administration', () => {
    expect(getAppRole('Behandlingsenhet')).toBe('treatment-unit');
    expect(getAllowedPortalByPermissions('Behandlingsenhet')).toBe('admin');

    expect(hasPermission('Behandlingsenhet', 'viewReferralQueue')).toBe(true);
    expect(hasPermission('Behandlingsenhet', 'confirmElvisBooking')).toBe(true);
    expect(hasPermission('Behandlingsenhet', 'recordPatientAction')).toBe(false);
    expect(hasPermission('Behandlingsenhet', 'manageUsers')).toBe(false);
    expect(hasPermission('Behandlingsenhet', 'viewAuditLog')).toBe(false);
  });
});
