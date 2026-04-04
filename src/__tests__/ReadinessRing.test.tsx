/**
 * @file Unit tests for ReadinessRing component.
 * Verifies accessibility attributes and color transitions based on score.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ReadinessRing } from '@/features/dashboard/components/readiness-ring';

describe('ReadinessRing', () => {
  it('renders with correct accessibility attributes', () => {
    const score = 75;
    render(<ReadinessRing score={score} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', score.toString());
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    expect(progressbar).toHaveAttribute('aria-label', 'Readiness score');
  });

  it('rounds the aria-valuenow to the nearest integer', () => {
    const score = 75.6;
    render(<ReadinessRing score={score} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '76');
  });

  it('hides decorative elements from screen readers', () => {
    const score = 50;
    const { container } = render(<ReadinessRing score={score} />);

    // Check that SVG is hidden
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');

    // Check that the text container is hidden
    const textContainer = container.querySelector('div.absolute');
    expect(textContainer).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies destructive color for scores below 40', () => {
    const score = 35;
    const { container } = render(<ReadinessRing score={score} />);

    // The second circle should have the color class
    const circle = container.querySelectorAll('circle')[1];
    expect(circle).toHaveClass('text-destructive');
  });

  it('applies orange color for scores between 40 and 69', () => {
    const score = 55;
    const { container } = render(<ReadinessRing score={score} />);

    const circle = container.querySelectorAll('circle')[1];
    expect(circle).toHaveClass('text-orange-500');
  });

  it('applies primary color for scores 70 and above', () => {
    const score = 85;
    const { container } = render(<ReadinessRing score={score} />);

    const circle = container.querySelectorAll('circle')[1];
    expect(circle).toHaveClass('text-primary');
  });
});
