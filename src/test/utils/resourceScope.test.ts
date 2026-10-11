import { describe, expect, it } from 'vitest';
import { canAccessResource } from '../../utils/resourceScope';
describe('resource scope', () => {
  it('separates sender from receiver and denies unassigned treatment access', () => {
    const referral = {departmentId:'D1', treatmentUnitId:'T1'};
    expect(canAccessResource({role:'Avdelning',careUnitId:'D1'},referral)).toBe(true);
    expect(canAccessResource({role:'Avdelning',careUnitId:'T1'},referral)).toBe(false);
    expect(canAccessResource({role:'Behandlingsenhet',careUnitId:'T1'},referral)).toBe(true);
    expect(canAccessResource({role:'Behandlingsenhet',careUnitId:'D1'},referral)).toBe(false);
    expect(canAccessResource({role:'Behandlingsenhet',careUnitId:'D1'},{careUnitId:'D1'})).toBe(false);
  });
  it.each(['Avdelning', 'Behandlingsenhet', 'Medicinskt ansvarig'])('scopes %s to its care unit', role => {
    const user = {role, careUnitId: 'A'};
    expect(canAccessResource(user, {departmentId: 'A', treatmentUnitId: 'A'})).toBe(true);
    expect(canAccessResource(user, {departmentId:'B', treatmentUnitId:'B', referralDepartment:'A'})).toBe(false);
    expect(canAccessResource(user, {})).toBe(false);
    expect(canAccessResource({role}, {careUnitId: 'A'})).toBe(false);
  });
  it('denies anonymous and unknown users, permits administrators', () => {
    expect(canAccessResource(null, {careUnitId: 'A'})).toBe(false);
    expect(canAccessResource({role: 'fake', careUnitId:'A'}, {careUnitId: 'A'})).toBe(false);
    expect(canAccessResource({role: 'Admin'}, {careUnitId: 'B'})).toBe(true);
  });
});
