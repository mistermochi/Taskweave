/**
 * @file Unit tests for IconBadge component.
 * Verifies that icons are rendered correctly with their associated
 * status colors and badges.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { IconBadge } from '../components/ui/IconBadge';
import { Zap } from 'lucide-react'; // Using a real icon for the test

describe('IconBadge', () => {
  it('renders the icon and applies the correct classes for primary variant', () => {
    render(<IconBadge icon={Zap} variant="primary" data-testid="badge" />);

    // Check if the component is in the document
    const badgeElement = screen.getByTestId('badge');
    expect(badgeElement).toBeInTheDocument();

    // Check for variant-specific classes
    expect(badgeElement).toHaveClass('bg-primary/10');
    expect(badgeElement).toHaveClass('text-primary');

    // Check if the icon is rendered (by checking for the presence of the SVG)
    const svgElement = badgeElement.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });

  it('applies the correct classes for size lg', () => {
    render(<IconBadge icon={Zap} size="lg" data-testid="badge-lg" />);

    const badgeElement = screen.getByTestId('badge-lg');
    expect(badgeElement).toHaveClass('w-12');
    expect(badgeElement).toHaveClass('h-12');
  });
});
