import React from 'react';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/shared/ui/ui/empty-state';
import { Search } from 'lucide-react';

describe('EmptyState Accessibility', () => {
  it('has role="region" and aria-labelledby linking to title', () => {
    const testTitle = "No Tasks Found";
    render(<EmptyState title={testTitle} icon={Search} />);

    const container = screen.getByRole('region');
    expect(container).toBeInTheDocument();

    const title = screen.getByText(testTitle);
    expect(title.tagName).toBe('H3');
    expect(title.id).toBeTruthy();
    expect(container).toHaveAttribute('aria-labelledby', title.id);
  });

  it('hides the decorative icon from screen readers', () => {
    const { container } = render(<EmptyState title="Test" icon={Search} />);

    // The icon container should have aria-hidden="true"
    const iconContainer = container.querySelector('.rounded-full.bg-muted');
    expect(iconContainer).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders title and message correctly', () => {
    render(<EmptyState title="Title" message="Message description" />);
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Message description")).toBeInTheDocument();
  });
});
