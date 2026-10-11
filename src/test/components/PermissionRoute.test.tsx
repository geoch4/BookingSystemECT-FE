import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import PermissionRoute from '../../components/routing/PermissionRoute';
const auth = vi.hoisted(() => ({token:'token',user:{role:'Avdelning'},hasAnyPermission:vi.fn(() => false)}));
vi.mock('../../context/useAuth', () => ({useAuth: () => auth}));
describe('PermissionRoute', () => {
  it('shows 403 without rendering protected content', () => {
    render(<MemoryRouter><PermissionRoute permission="manageUsers"><p>Protected content</p></PermissionRoute></MemoryRouter>);
    expect(screen.getByRole('heading', {name:'Du saknar behörighet'})).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });
  it('renders authorized content', () => {
    auth.hasAnyPermission.mockReturnValue(true);
    render(<MemoryRouter><PermissionRoute permission="createReferral"><p>Authorized content</p></PermissionRoute></MemoryRouter>);
    expect(screen.getByText('Authorized content')).toBeInTheDocument();
  });
});
