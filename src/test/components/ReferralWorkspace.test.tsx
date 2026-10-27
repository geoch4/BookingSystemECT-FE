import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ReferralWorkspace, { type ReferralWorkspaceProps } from '../../components/referral/ReferralWorkspace';
import { buildReferralCases } from '../../utils/referralCases';
import type { BookingDto } from '../../types';

const booking: BookingDto = {
  bookingId: 1, patientId: 1, treatmentTypeId: 1, priority: 'Red', status: 'Pending',
  date: '2026-10-23T09:00:00', createdAt: '2026-10-20T08:00:00', createdById: 1,
  departmentId: 'Avdelning 361', treatmentUnitId: 'Enhet T1', referralDepartment: 'Avdelning 361',
  referralContactName: 'Testkontakt', referralContactPhone: 'TEST-TELEFON', departmentPriority: 1,
};
const referrals = buildReferralCases([booking, { ...booking, bookingId: 2, patientId: 2, priority: 'Green', treatmentTypeId: 5, referralDepartment: 'Avdelning 362', departmentId: 'Avdelning 362' }], {
  1: { patientId: 1, fullName: 'Anna Test', socialSecurityNumber: 'DEMO-1' },
  2: { patientId: 2, fullName: 'Johan Test', socialSecurityNumber: 'DEMO-2' },
}, {});

function props(): ReferralWorkspaceProps {
  return {
    referrals, notes: { 'referral-1': { type: 'completion', title: 'Komplettering begärd', comment: 'Aktuell läkemedelslista behövs.', createdAt: '2026-10-21T10:00:00', responseComment: 'Avdelningens testsvar', respondedAt: '2026-10-22T10:00:00' } },
    events: {}, canRequestCompletion: true, canBookOrPrioritize: true, prioritizeLabel: 'Prioritera / boka',
    onRequestCompletion: vi.fn(), onPrioritize: vi.fn(),
  };
}
function mount(options = props()) {
  return render(<MemoryRouter><ReferralWorkspace {...options} /></MemoryRouter>);
}

describe('ReferralWorkspace', () => {
  it('keeps patient identity, warnings and next actions visible on every tab', () => {
    const options = props(); mount(options);
    for (const label of ['Översikt', 'Underlag', 'Logistik', 'Historik']) {
      fireEvent.click(screen.getByRole('tab', { name: label }));
      expect(screen.getByRole('heading', { name: 'Anna Test' })).toBeVisible();
      expect(screen.getByRole('region', { name: 'Viktiga varningar' })).toBeVisible();
      expect(screen.getByRole('contentinfo', { name: 'Nästa steg och åtgärder' })).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: 'Begär komplettering' }));
    }
    expect(options.onRequestCompletion).toHaveBeenCalledTimes(4);
    expect(options.onRequestCompletion).toHaveBeenLastCalledWith(referrals[0]);
  });

  it('preserves all logistics without presenting suggested or unregistered data as confirmed', () => {
    mount(); fireEvent.click(screen.getByRole('tab', { name: 'Logistik' }));
    const panel = screen.getByRole('tabpanel', { name: 'Logistik' });
    for (const value of ['Enhet T1', 'Sahlgrenska ECT/rTMS', 'Slutenvård', 'Östra', 'Testkontakt', 'TEST-TELEFON', 'Ingen bokningsstatus registrerad här', 'Inte registrerat', 'Inte registrerad']) {
      expect(within(panel).getByText(value, { exact: true })).toBeVisible();
    }
    fireEvent.click(within(panel).getByText('Kapacitet och alternativ enhet'));
    expect(within(panel).getByText(/Vid överbelastning/)).toBeVisible();
  });

  it('shows every document and the full history including the department response', () => {
    mount(); fireEvent.click(screen.getByRole('tab', { name: 'Underlag' }));
    const panel = screen.getByRole('tabpanel', { name: 'Underlag' });
    for (const item of referrals[0].documents) expect(within(panel).getByText(item.label)).toBeVisible();
    fireEvent.click(screen.getByRole('tab', { name: 'Historik' }));
    expect(screen.getByText('Avdelningens testsvar')).toBeVisible();
    expect(screen.getByText('Remiss skickad')).toBeVisible();
  });

  it('changes patients without leaving the list or leaking the previous patient tab', () => {
    mount(); fireEvent.click(screen.getByRole('tab', { name: 'Logistik' }));
    fireEvent.click(screen.getByRole('button', { name: 'Visa remiss för Johan Test' }));
    expect(screen.getByRole('heading', { name: 'Johan Test' })).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Översikt' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: 'Visa remiss för Anna Test' })).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Viktiga varningar' })).not.toBeInTheDocument();
  });

  it('clears the visible patient when searching returns no matches', () => {
    mount(); fireEvent.change(screen.getByLabelText('Hitta en patient'), { target: { value: 'missing-patient' } });
    expect(screen.queryByRole('heading', { name: 'Anna Test' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Begär komplettering' })).not.toBeInTheDocument();
    expect(screen.getByText('Inga remisser matchar sökningen eller filtret.')).toBeVisible();
    fireEvent.change(screen.getByLabelText('Hitta en patient'), { target: { value: '362' } });
    expect(screen.getByRole('heading', { name: 'Johan Test' })).toBeVisible();
  });

  it('honors role permissions and keeps the original action callbacks', () => {
    const options = props(); options.canRequestCompletion = false;
    const view = mount(options);
    expect(screen.queryByRole('button', { name: 'Begär komplettering' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Prioritera / boka' }));
    expect(options.onPrioritize).toHaveBeenCalledWith(referrals[0]);
    view.rerender(<MemoryRouter><ReferralWorkspace {...options} canBookOrPrioritize={false} /></MemoryRouter>);
    expect(screen.queryByRole('button', { name: 'Prioritera / boka' })).not.toBeInTheDocument();
  });

  it('supports arrow, Home and End keys in the tab list', async () => {
    mount(); const user = userEvent.setup();
    screen.getByRole('tab', { name: 'Översikt' }).focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Logistik' })).toHaveFocus();
    expect(screen.getByRole('tabpanel', { name: 'Logistik' })).toBeVisible();
    await user.keyboard('{End}'); expect(screen.getByRole('tab', { name: 'Historik' })).toHaveFocus();
    await user.keyboard('{Home}'); expect(screen.getByRole('tab', { name: 'Översikt' })).toHaveFocus();
  });
});
