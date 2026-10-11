import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../context/AuthContext';
import { useAuth } from '../../context/useAuth';

const serverLogout = vi.hoisted(() => vi.fn());
vi.mock('../../api/auth', () => ({ logout: serverLogout }));

function Account() {
  const { user, logout } = useAuth();
  return <><p>{user ? 'Inloggad' : 'Utloggad'}</p><button onClick={logout}>Logga ut</button></>;
}

function setup() {
  const payload = btoa(JSON.stringify({ sub: '1', role: 'Avdelning', exp: Math.floor(Date.now() / 1000) + 3600 }));
  sessionStorage.setItem('authToken', `e30.${payload}.synthetic`);
  const client = new QueryClient();
  client.setQueryData(['patients'], ['Synthetic patient']);
  render(<QueryClientProvider client={client}><AuthProvider><Account /></AuthProvider></QueryClientProvider>);
  return client;
}

describe('server logout', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    serverLogout.mockReset();
  });

  it('waits for server confirmation before clearing session and patient cache', async () => {
    let finish!: () => void;
    serverLogout.mockReturnValue(new Promise<void>(resolve => { finish = resolve; }));
    const client = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Logga ut' }));
    expect(serverLogout).toHaveBeenCalledOnce();
    expect(sessionStorage.getItem('authToken')).not.toBeNull();
    finish();
    await screen.findByText('Utloggad');
    expect(sessionStorage.getItem('authToken')).toBeNull();
    expect(client.getQueryData(['patients'])).toBeUndefined();
  });

  it('shows failure and allows retry when the server cannot revoke the session', async () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    serverLogout.mockRejectedValueOnce(new Error('Network unavailable')).mockResolvedValueOnce(undefined);
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Logga ut' }));
    await waitFor(() => expect(alert).toHaveBeenCalledOnce());
    expect(screen.getByText('Inloggad')).toBeInTheDocument();
    expect(sessionStorage.getItem('authToken')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Logga ut' }));
    await screen.findByText('Utloggad');
    alert.mockRestore();
  });
});
