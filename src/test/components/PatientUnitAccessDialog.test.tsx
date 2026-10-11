import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PatientUnitAccessDialog from '../../components/common/PatientUnitAccessDialog';

const state = vi.hoisted(() => ({ isAdmin: true }));
const api = vi.hoisted(() => ({
  getPatientUnits: vi.fn(), updatePatientUnit: vi.fn(), transferPatient: vi.fn(),
  getDepartments: vi.fn(), getTreatmentUnits: vi.fn(),
}));
vi.mock('../../context/useAuth', () => ({ useAuth: () => state }));
vi.mock('../../api/patients', () => api);
vi.mock('../../api/bookings', () => ({ getTreatmentUnits: api.getTreatmentUnits }));

function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><PatientUnitAccessDialog patientId={7} onClose={() => {}} /></QueryClientProvider>);
}

describe('patient unit access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.isAdmin = true;
    api.getPatientUnits.mockResolvedValue([{ unitId: 'D1', kind: 'department', isActive: true, reason: 'Created' }]);
    api.getDepartments.mockResolvedValue(['D1', 'D2']);
    api.getTreatmentUnits.mockResolvedValue(['T1']);
    api.updatePatientUnit.mockResolvedValue(undefined);
  });

  it('requires a reason and sends an explicit revocation for the selected patient and unit', async () => {
    const user = userEvent.setup();
    show();
    const revoke = await screen.findByRole('button', { name: 'Återkalla' });
    expect(revoke).toBeDisabled();
    await user.type(screen.getByLabelText('Orsak'), 'Överflyttning');
    await user.click(revoke);
    await waitFor(() => expect(api.updatePatientUnit).toHaveBeenCalledWith(7, {
      unitId: 'D1', kind: 'department', isActive: false, reason: 'Överflyttning',
    }));
  });

  it('does not expose controls or fetch memberships to non-administrators', () => {
    state.isAdmin = false;
    show();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.getPatientUnits).not.toHaveBeenCalled();
    expect(api.getDepartments).not.toHaveBeenCalled();
  });
});
