/**
 * @file Unit tests for QuickFocusModal.
 * Verifies that the modal correctly allows users to create
 * adhoc tasks and transition into focus mode.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuickFocusModal } from '../components/QuickFocusModal';
import { useReferenceContext } from '../context/ReferenceContext';
import { useNavigation } from '../context/NavigationContext';
import { TaskService } from '../services/TaskService';
import { Tag } from '../types';

// Mock dependencies

// Global firebase mock to prevent init errors
jest.mock('../firebase', () => ({
  auth: {},
  db: {},
}));

jest.mock('../context/ReferenceContext');
jest.mock('../context/NavigationContext');
jest.mock('../services/TaskService');

const mockUseReferenceContext = useReferenceContext as jest.Mock;
const mockUseNavigation = useNavigation as jest.Mock;

const mockTags: Tag[] = [
  { id: 'work', name: 'Work', color: '#c084fc', parentId: null, order: 0 },
];
const mockFocusOnTask = jest.fn();
const mockOnClose = jest.fn();

// Mock the TaskService instance and its methods
const mockAddTask = jest.fn();
const mockTaskServiceInstance = {
  addTask: mockAddTask,
};
(TaskService.getInstance as jest.Mock) = jest.fn().mockReturnValue(mockTaskServiceInstance);


describe('QuickFocusModal', () => {

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockUseReferenceContext.mockReturnValue({ tags: mockTags });
    mockUseNavigation.mockReturnValue({ focusOnTask: mockFocusOnTask });
  });

  it('should render the modal with all elements when open', () => {
    render(<QuickFocusModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Start Unplanned Focus')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('What are you working on?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start focusing/i })).toBeInTheDocument();
  });

  it('should keep the "Start Focusing" button disabled if the title is empty', () => {
    render(<QuickFocusModal isOpen={true} onClose={mockOnClose} />);
    const startButton = screen.getByRole('button', { name: /start focusing/i });
    expect(startButton).toBeDisabled();
  });

  it('should enable the "Start Focusing" button when a title is entered', () => {
    render(<QuickFocusModal isOpen={true} onClose={mockOnClose} />);
    const input = screen.getByPlaceholderText('What are you working on?');
    const startButton = screen.getByRole('button', { name: /start focusing/i });

    fireEvent.change(input, { target: { value: 'My new focus task' } });

    expect(startButton).not.toBeDisabled();
  });

  it('should call addTask with duration 0 and then focusOnTask on submit', async () => {
    // Arrange
    const newTaskId = 'new-quick-task-id';
    mockAddTask.mockResolvedValue(newTaskId);
    render(<QuickFocusModal isOpen={true} onClose={mockOnClose} />);

    // Act
    const input = screen.getByPlaceholderText('What are you working on?');
    fireEvent.change(input, { target: { value: 'Test quick focus' } });
    
    const startButton = screen.getByRole('button', { name: /start focusing/i });
    fireEvent.click(startButton);

    // Assert
    await waitFor(() => {
      // 1. Verify TaskService.addTask was called with the correct parameters
      expect(mockAddTask).toHaveBeenCalledTimes(1);
      expect(mockAddTask).toHaveBeenCalledWith(
        'Test quick focus', // title
        '',                 // categoryId (default)
        0,                  // CRITICAL: duration must be 0
        50,                 // energy (default)
        '',                 // notes
        undefined,          // dueDate
        undefined           // assignedDate
      );
    });

    // 2. Verify the modal tried to close
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    // 3. Verify navigation.focusOnTask was called with the new ID after a short delay
    await waitFor(() => {
        expect(mockFocusOnTask).toHaveBeenCalledTimes(1);
        expect(mockFocusOnTask).toHaveBeenCalledWith(newTaskId);
    }, { timeout: 200 }); // Wait a bit longer to account for the setTimeout in the component
  });
});
