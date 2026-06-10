import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Spinner from '../../components/common/Spinner';

expect.extend(toHaveNoViolations);

describe('Spinner', () => {
  it('has role="status" for screen readers', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has an accessible label', () => {
    render(<Spinner />);
    expect(screen.getByLabelText('Laddar')).toBeInTheDocument();
  });

  it('applies custom size via inline style', () => {
    const { container } = render(<Spinner size={32} />);
    const el = container.querySelector('[role="status"]') as HTMLElement;
    expect(el.style.width).toBe('32px');
    expect(el.style.height).toBe('32px');
  });

  it('defaults to 20px when no size prop is given', () => {
    const { container } = render(<Spinner />);
    const el = container.querySelector('[role="status"]') as HTMLElement;
    expect(el.style.width).toBe('20px');
  });

  it('has no axe accessibility violations', async () => {
    const { container } = render(<Spinner />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
