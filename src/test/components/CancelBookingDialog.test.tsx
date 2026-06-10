import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import CancelBookingDialog from '../../components/common/CancelBookingDialog';

expect.extend(toHaveNoViolations);

describe('CancelBookingDialog', () => {
  it('renders patient name and time', () => {
    render(
      <CancelBookingDialog
        patientName="Andersson, Anna"
        time="09:15"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText(/Andersson, Anna/)).toBeInTheDocument();
    expect(screen.getByText(/09:15/)).toBeInTheDocument();
  });

  it('calls onCancel when "Behåll" is clicked', () => {
    const onCancel = vi.fn();
    render(
      <CancelBookingDialog patientName="P" time="T" onConfirm={() => {}} onCancel={onCancel} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Behåll' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm with empty string when no reason entered', () => {
    const onConfirm = vi.fn();
    render(
      <CancelBookingDialog patientName="P" time="T" onConfirm={onConfirm} onCancel={() => {}} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Avboka' }));
    expect(onConfirm).toHaveBeenCalledWith('');
  });

  it('calls onConfirm with trimmed reason text', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <CancelBookingDialog patientName="P" time="T" onConfirm={onConfirm} onCancel={() => {}} />,
    );
    await user.type(screen.getByRole('textbox'), '  Sjukdom  ');
    fireEvent.click(screen.getByRole('button', { name: 'Avboka' }));
    expect(onConfirm).toHaveBeenCalledWith('Sjukdom');
  });

  it('calls onCancel on Escape key', () => {
    const onCancel = vi.fn();
    render(
      <CancelBookingDialog patientName="P" time="T" onConfirm={() => {}} onCancel={onCancel} />,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('has dialog role', () => {
    render(
      <CancelBookingDialog patientName="P" time="T" onConfirm={() => {}} onCancel={() => {}} />,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has no axe accessibility violations', async () => {
    const { container } = render(
      <CancelBookingDialog
        patientName="Andersson, Anna"
        time="09:15"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
