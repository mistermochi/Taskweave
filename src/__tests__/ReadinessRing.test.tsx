import React from 'react';
import { render, screen } from '@testing-library/react';
import { ReadinessRing } from '@/features/dashboard/components/readiness-ring';

describe('ReadinessRing', () => {
  it('renders with correct accessibility attributes', () => {
    render(<ReadinessRing score={75} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '75');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    expect(progressbar).toHaveAttribute('aria-label', 'Readiness score');
  });

  it('hides decorative elements from screen readers', () => {
    const { container } = render(<ReadinessRing score={75} />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');

    const textContainer = container.querySelector('.absolute');
    expect(textContainer).toHaveAttribute('aria-hidden', 'true');
  });

  it('displays the rounded score text', () => {
    render(<ReadinessRing score={75.6} />);
    expect(screen.getByText('76')).toBeInTheDocument();
  });

  it('applies the correct color class based on score', () => {
    const { rerender } = render(<ReadinessRing score={30} />);
    let progressCircle = screen.getByRole('progressbar').querySelector('circle:nth-child(2)');
    expect(progressCircle).toHaveClass('text-destructive');

    rerender(<ReadinessRing score={50} />);
    progressCircle = screen.getByRole('progressbar').querySelector('circle:nth-child(2)');
    expect(progressCircle).toHaveClass('text-orange-500');

    rerender(<ReadinessRing score={80} />);
    progressCircle = screen.getByRole('progressbar').querySelector('circle:nth-child(2)');
    expect(progressCircle).toHaveClass('text-primary');
  });
});
