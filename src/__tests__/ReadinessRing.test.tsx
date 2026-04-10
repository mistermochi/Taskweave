/**
 * @file Unit tests for ReadinessRing component.
 * Verifies accessibility attributes and progress visualization.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ReadinessRing } from '@/features/dashboard/components/readiness-ring';

describe('ReadinessRing', () => {
  it('renders with progressbar role and correct accessibility attributes', () => {
    render(<ReadinessRing score={75} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute('aria-valuenow', '75');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    expect(progressbar).toHaveAttribute('aria-label', 'Readiness score');
  });

  it('hides decorative elements from screen readers', () => {
    const { container } = render(<ReadinessRing score={75} />);

    // SVG should be hidden
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');

    // Internal text container should be hidden (since progressbar role covers it)
    const textContainer = screen.getByText('75').parentElement;
    expect(textContainer).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies the correct color class based on score', () => {
    const { rerender, container } = render(<ReadinessRing score={30} />);
    let progressCircle = container.querySelector('circle:nth-child(2)');
    expect(progressCircle).toHaveClass('text-destructive');

    rerender(<ReadinessRing score={50} />);
    progressCircle = container.querySelector('circle:nth-child(2)');
    expect(progressCircle).toHaveClass('text-orange-500');

    rerender(<ReadinessRing score={85} />);
    progressCircle = container.querySelector('circle:nth-child(2)');
    expect(progressCircle).toHaveClass('text-primary');
  });
});
