import React from 'react';
import { render, screen } from '@testing-library/react';
import { ReadinessRing } from '../features/dashboard/components/readiness-ring';
import '@testing-library/jest-dom';

describe('ReadinessRing', () => {
  it('renders with correct accessibility attributes', () => {
    const score = 75;
    render(<ReadinessRing score={score} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute('aria-valuenow', score.toString());
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    expect(progressbar).toHaveAttribute('aria-label', 'Biological readiness score');
  });

  it('hides decorative elements from screen readers', () => {
    const { container } = render(<ReadinessRing score={50} />);

    // The SVG and the text container should be aria-hidden
    const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenElements.length).toBeGreaterThanOrEqual(2);
  });
});
