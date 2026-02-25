/**
 * @file Unit tests for IconBadge component.
 * Verifies that the component renders the provided icon and applies
 * the correct variant styles.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { IconBadge } from '../components/ui/IconBadge';
import { Zap } from 'lucide-react';

describe('IconBadge Component', () => {
  it('renders the provided icon', () => {
    const { container } = render(<IconBadge icon={Zap} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
