import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import EmptyState from '../../components/common/EmptyState';

expect.extend(toHaveNoViolations);

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="Inga bokningar" />);
    expect(screen.getByText('Inga bokningar')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="T" description="Ingen data hittades." />);
    expect(screen.getByText('Ingen data hittades.')).toBeInTheDocument();
  });

  it('does not render description when omitted', () => {
    render(<EmptyState title="T" />);
    expect(screen.queryByText('Ingen data hittades.')).not.toBeInTheDocument();
  });

  it('renders action slot when provided', () => {
    render(<EmptyState title="T" action={<button>Skapa ny</button>} />);
    expect(screen.getByRole('button', { name: 'Skapa ny' })).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<EmptyState title="T" icon={<span data-testid="icon">★</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('has no axe accessibility violations', async () => {
    const { container } = render(
      <EmptyState
        title="Inga poster"
        description="Lägg till en post för att komma igång."
        action={<button>Lägg till</button>}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
