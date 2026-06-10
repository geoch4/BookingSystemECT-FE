import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import ConfirmDialog from '../../components/common/ConfirmDialog';

expect.extend(toHaveNoViolations);

describe('ConfirmDialog', () => {
  it('renders title and message', () => {
    render(
      <ConfirmDialog
        title="Bekräfta radering"
        message="Är du säker?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText('Bekräfta radering')).toBeInTheDocument();
    expect(screen.getByText('Är du säker?')).toBeInTheDocument();
  });

  it('shows custom confirm and cancel labels', () => {
    render(
      <ConfirmDialog
        title="T"
        message="M"
        confirmLabel="Radera"
        cancelLabel="Behåll"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'Radera' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Behåll' })).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog title="T" message="M" onConfirm={onConfirm} onCancel={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Bekräfta' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog title="T" message="M" onConfirm={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Avbryt' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when clicking the backdrop', () => {
    const onCancel = vi.fn();
    const { container } = render(
      <ConfirmDialog title="T" message="M" onConfirm={() => {}} onCancel={onCancel} />,
    );
    fireEvent.click(container.firstChild as HTMLElement);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel on Escape key', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog title="T" message="M" onConfirm={() => {}} onCancel={onCancel} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('has dialog role with aria-modal', () => {
    render(<ConfirmDialog title="T" message="M" onConfirm={() => {}} onCancel={() => {}} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('has no axe accessibility violations', async () => {
    const { container } = render(
      <ConfirmDialog
        title="Radera post"
        message="Posten tas bort permanent."
        confirmLabel="Radera"
        cancelLabel="Avbryt"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
