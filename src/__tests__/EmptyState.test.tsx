import React from 'react';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '../shared/ui/ui/empty-state';
import '@testing-library/jest-dom';

describe('EmptyState', () => {
  it('renders with correct accessibility attributes', () => {
    const title = 'No tasks';
    const message = 'You have no tasks yet.';
    render(<EmptyState title={title} message={message} />);

    const region = screen.getByRole('region');
    const heading = screen.getByRole('heading', { name: title });

    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('aria-labelledby', heading.id);
    expect(heading).toHaveAttribute('id');
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('hides the icon from screen readers', () => {
    const SearchIcon = ({ size, className }: { size?: number, className?: string }) => <svg data-testid="search-icon" />;
    // @ts-ignore - Mocking LucideIcon
    render(<EmptyState title="Title" icon={SearchIcon} />);

    const iconContainer = screen.getByTestId('search-icon').parentElement;
    expect(iconContainer).toHaveAttribute('aria-hidden', 'true');
  });
});
