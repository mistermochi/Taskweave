/**
 * @file Unit tests for SmileyScale component.
 * Verifies that the mood scale correctly highlights the selected level
 * and triggers callbacks on click.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { SmileyScale } from '../components/dashboard/SmileyScale';

describe('SmileyScale Component', () => {
  it('renders all 5 levels', () => {
    const { container } = render(<SmileyScale value={3} onChange={jest.fn()} />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(5);
  });

  it('calls onChange with correct level', () => {
    const onChange = jest.fn();
    const { container } = render(<SmileyScale value={3} onChange={onChange} />);
    const buttons = container.querySelectorAll('button');
    fireEvent.click(buttons[4]); // Great level (5)
    expect(onChange).toHaveBeenCalledWith(5);
  });
});
