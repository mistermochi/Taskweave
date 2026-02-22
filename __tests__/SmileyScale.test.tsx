import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SmileyScale } from '../components/dashboard/SmileyScale';
import { Laugh } from 'lucide-react'; // Import one of the icons to check for its presence

describe('SmileyScale', () => {
  it('renders all 5 smiley options', () => {
    render(<SmileyScale value={3} onChange={() => {}} />);
    
    // Find all buttons, which represent the smileys
    const smileyButtons = screen.getAllByRole('button');
    expect(smileyButtons).toHaveLength(5);
  });

  it('calls the onChange callback with the correct value when a smiley is clicked', () => {
    const mockOnChange = jest.fn();
    render(<SmileyScale value={3} onChange={mockOnChange} />);

    // Get all buttons and click the last one (level 5)
    const smileyButtons = screen.getAllByRole('button');
    fireEvent.click(smileyButtons[4]);

    // Expect the mock function to have been called with 5
    expect(mockOnChange).toHaveBeenCalledWith(5);

    // Click the first one (level 1)
    fireEvent.click(smileyButtons[0]);
    expect(mockOnChange).toHaveBeenCalledWith(1);
  });

  it('applies active styles to the currently selected value', () => {
    const { container } = render(<SmileyScale value={4} onChange={() => {}} />);
    
    // The 4th button (index 3) should have the 'scale-110' class indicating it's active
    const smileyButtons = screen.getAllByRole('button');
    expect(smileyButtons[3]).toHaveClass('scale-110');
    
    // The 1st button (index 0) should have 'opacity-40' indicating it's inactive
    expect(smileyButtons[0]).toHaveClass('opacity-40');
  });
});
