/**
 * @file Unit tests for QuickFocusModal component.
 * Verifies that the modal correctly handles task creation for adhoc focus sessions.
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QuickFocusModal } from '../components/QuickFocusModal';
import { TaskService } from '../services/TaskService';

jest.mock('../services/TaskService');
jest.mock('../context/ReferenceContext', () => ({
    useReferenceContext: () => ({ tags: [] })
}));
jest.mock('../context/NavigationContext', () => ({
    useNavigation: () => ({ focusOnTask: jest.fn() })
}));

describe('QuickFocusModal Component', () => {
  it('renders correctly when open', () => {
    render(<QuickFocusModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText(/Start Unplanned Focus/i)).toBeInTheDocument();
  });

  it('calls addTask and focusOnTask upon start', async () => {
    const addTaskSpy = jest.spyOn(TaskService.getInstance(), 'addTask').mockResolvedValue('new-task-id');
    render(<QuickFocusModal isOpen={true} onClose={jest.fn()} />);
    
    const input = screen.getByPlaceholderText(/What are you working on/i);
    fireEvent.change(input, { target: { value: 'Adhoc Task' } });

    const button = screen.getByText(/Start Focusing/i);
    await act(async () => {
        fireEvent.click(button);
    });

    expect(addTaskSpy).toHaveBeenCalledWith('Adhoc Task', '', 0, 50, '', undefined, undefined);
  });
});
