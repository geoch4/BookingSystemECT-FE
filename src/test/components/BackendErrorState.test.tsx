import { render, screen } from '@testing-library/react';
import axios, { AxiosHeaders, type AxiosError } from 'axios';
import BackendErrorState from '../../components/common/BackendErrorState';

function createAxiosError(status: number): AxiosError {
  return new axios.AxiosError(
    'Request failed',
    undefined,
    undefined,
    undefined,
    {
      data: {},
      status,
      statusText: '',
      headers: {},
      config: { headers: new AxiosHeaders() },
    },
  );
}

describe('BackendErrorState', () => {
  it('shows permission wording for forbidden responses', () => {
    render(<BackendErrorState error={createAxiosError(403)} onRetry={() => {}} />);

    expect(screen.getByText('Du har inte behörighet till den här vyn')).toBeInTheDocument();
    expect(screen.getByText(/Din roll saknar åtkomst här/)).toBeInTheDocument();
  });

  it('shows server wording for backend errors', () => {
    render(<BackendErrorState error={createAxiosError(500)} onRetry={() => {}} />);

    expect(screen.getByText('Backend har ett serverfel')).toBeInTheDocument();
  });
});
