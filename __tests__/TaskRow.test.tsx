

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskRow } from '../components/TaskRow';
import { TaskEntity, Tag } from '../types';

// Mock window.matchMedia for Jest
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock scrollIntoView for Jest
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock services that could be called
jest.mock('../services/TagService', () => ({
  TagService: {
    getInstance: () => ({
      createTag: jest.fn().mockResolvedValue('new-tag-id'),
    }),
  },
}));

describe('TaskRow - Dependencies UI', () => {
  const blockerTask: TaskEntity = {
      id: 'task-1',
      title: 'I am a blocker',
      status: 'active',
      duration: 30,
      energy: 'Medium',
      category: 'Work',
      createdAt: Date.now(),
  } as TaskEntity;

  const blockedTask: TaskEntity = {
      id: 'task-2',
      title: 'I am blocked',
      status: 'active',
      duration: 30,
      energy: 'Medium',
      category: 'Work',
      createdAt: Date.now(),
      blockedBy: ['task-1'],
  } as TaskEntity;

  const allTasks = [blockerTask, blockedTask];
  const mockTags: Tag[] = [];

  it('should show a lock icon and be disabled if a task is blocked', () => {
      render(
          <TaskRow
              task={blockedTask}
              allTasks={allTasks}
              tags={mockTags}
              onComplete={jest.fn()}
              onFocus={jest.fn()}
          />
      );

      // Check for lock icon via title of its container
      expect(screen.getByTitle(`Blocked by: ${blockerTask.title}`)).toBeInTheDocument();
      
      // Check that the completion button is disabled
      const completeButton = screen.getByRole('button', { name: 'Complete task' });
      expect(completeButton).toBeDisabled();
  });

  it('should show a "blocking" indicator if a task is blocking others', () => {
      render(
          <TaskRow
              task={blockerTask}
              allTasks={allTasks}
              tags={mockTags}
              onComplete={jest.fn()}
              onFocus={jest.fn()}
          />
      );
      
      // The "Blocking 1" text should be present.
      expect(screen.getByText('Blocking 1')).toBeInTheDocument();
      // And its title should list the dependent tasks
      expect(screen.getByTitle(`Blocking 1 task: ${blockedTask.title}`)).toBeInTheDocument();
  });

  it('should not show a "blocking" indicator if it blocks a completed task', () => {
      const completedDependentTask: TaskEntity = {
          ...blockedTask,
          status: 'completed',
      };

      render(
          <TaskRow
              task={blockerTask}
              allTasks={[blockerTask, completedDependentTask]}
              tags={mockTags}
              onComplete={jest.fn()}
              onFocus={jest.fn()}
          />
      );
      
      // The indicator should NOT be present
      expect(screen.queryByText(/Blocking/)).not.toBeInTheDocument();
  });
});


describe('TaskRow - UI Interaction Tests', () => {
  const mockTask: TaskEntity = {
    id: 'task-1',
    title: 'A task to be tested',
    status: 'active',
    duration: 30,
    energy: 'Medium',
    category: 'tag-work',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } as TaskEntity;

  const mockTaskWithoutDate: TaskEntity = {
    id: 'task-2',
    title: 'A task with no date',
    status: 'active',
    duration: 30,
    energy: 'tag-work',
    category: 'Work',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } as TaskEntity;

  const mockTags: Tag[] = [
    { id: 'tag-work', name: 'Work', color: '#c084fc', parentId: null, order: 0 },
  ];
  
  // Test case for the duration picker
  it('should update duration via the picker when in edit mode', async () => {
    const handleUpdate = jest.fn();

    render(
      <TaskRow
        task={mockTask}
        allTasks={[]}
        tags={mockTags}
        onComplete={jest.fn()}
        onFocus={jest.fn()}
        onUpdate={handleUpdate}
        initialIsEditing={true} // Start in edit mode to test pickers
      />
    );

    // 1. Find and click the duration chip to open its popover
    const durationChip = screen.getByText('30m');
    fireEvent.click(durationChip);

    // 2. The popover should be visible. Find and click the new duration option.
    const option45m = await screen.findByText('45m');
    fireEvent.click(option45m);
    
    // 3. Click the save button to confirm the changes
    const saveButton = screen.getByTitle('Save');
    fireEvent.click(saveButton);

    // 4. Assert that the onUpdate prop was called with the correct data
    await waitFor(() => {
      expect(handleUpdate).toHaveBeenCalledTimes(1);
      expect(handleUpdate).toHaveBeenCalledWith(
        mockTask,
        expect.objectContaining({ duration: 45 })
      );
    });
  });

  // Test case for the energy picker
  it('should update energy via the picker when in edit mode', async () => {
    const handleUpdate = jest.fn();
    render(
      <TaskRow
        task={mockTask} // Default energy: 'Medium'
        allTasks={[]}
        tags={mockTags}
        onComplete={jest.fn()}
        onFocus={jest.fn()}
        onUpdate={handleUpdate}
        initialIsEditing={true}
      />
    );

    // 1. The chip for Medium energy displays 'Med'. Find and click it.
    const energyChip = screen.getByText('Med');
    fireEvent.click(energyChip);

    // 2. Popover appears. Find and click the 'High' energy option.
    const optionHigh = await screen.findByText('High');
    fireEvent.click(optionHigh);

    // 3. Click the save button.
    const saveButton = screen.getByTitle('Save');
    fireEvent.click(saveButton);

    // 4. Assert that onUpdate was called with the new energy level.
    await waitFor(() => {
      expect(handleUpdate).toHaveBeenCalledWith(
        mockTask,
        expect.objectContaining({ energy: 'High' })
      );
    });
  });

  // Test case for the assigned date picker
  it('should set an assigned date via the picker when in edit mode', async () => {
    const handleUpdate = jest.fn();
    // The DatePicker sets the time to noon for assigned dates
    const expectedDate = new Date();
    expectedDate.setHours(12, 0, 0, 0); 
    const expectedTimestamp = expectedDate.getTime();

    render(
      <TaskRow
        task={mockTaskWithoutDate} // This mock task has no assigned date
        allTasks={[]}
        tags={mockTags}
        onComplete={jest.fn()}
        onFocus={jest.fn()}
        onUpdate={handleUpdate}
        initialIsEditing={true}
      />
    );

    // 1. Find the "Schedule" chip, which appears when no date is set.
    const scheduleChip = screen.getByText('Schedule');
    fireEvent.click(scheduleChip);

    // 2. In the popover, find and click the "Today" button.
    const optionToday = await screen.findByText('Today');
    fireEvent.click(optionToday);

    // 3. Click the save button.
    const saveButton = screen.getByTitle('Save');
    fireEvent.click(saveButton);

    // 4. Assert that onUpdate was called with today's timestamp.
    await waitFor(() => {
      expect(handleUpdate).toHaveBeenCalledWith(
        mockTaskWithoutDate,
        expect.objectContaining({ assignedDate: expectedTimestamp })
      );
    });
  });

  // Test case for recurrence
  it('should update a complex weekly recurrence via the picker when in edit mode', async () => {
    const handleUpdate = jest.fn();
    const mockTaskWithDueDate: TaskEntity = {
        ...mockTask,
        id: 'task-recur',
        // Aug 1, 2024 is a Thursday
        dueDate: new Date('2024-08-01T12:00:00Z').getTime(), 
        recurrence: undefined,
    };

    render(
      <TaskRow
        task={mockTaskWithDueDate}
        allTasks={[]}
        tags={mockTags}
        onComplete={jest.fn()}
        onFocus={jest.fn()}
        onUpdate={handleUpdate}
        initialIsEditing={true}
      />
    );

    // 1. Find and click the recurrence chip.
    const recurrenceChip = screen.getByText('Repeat');
    fireEvent.click(recurrenceChip);

    // 2. Change frequency to "weekly".
    const frequencySelect = await screen.findByRole('combobox');
    fireEvent.change(frequencySelect, { target: { value: 'weekly' } });

    // 3. By default, Thursday should be selected (from the due date). We will de-select it.
    const thursdayButton = await screen.findByRole('button', { name: 'Thursday' });
    fireEvent.click(thursdayButton); 

    // 4. Now select Monday and Friday.
    const mondayButton = await screen.findByRole('button', { name: 'Monday' });
    const fridayButton = await screen.findByRole('button', { name: 'Friday' });
    fireEvent.click(mondayButton);
    fireEvent.click(fridayButton);

    // 5. Change the interval to "2" (every 2 weeks)
    const intervalInput = await screen.findByRole('spinbutton');
    fireEvent.change(intervalInput, { target: { value: '2' } });

    // 6. Click the save button.
    const saveButton = screen.getByTitle('Save');
    fireEvent.click(saveButton);

    // 7. Assert that onUpdate was called with the correct recurrence data.
    await waitFor(() => {
      expect(handleUpdate).toHaveBeenCalledTimes(1);
      expect(handleUpdate).toHaveBeenCalledWith(
        mockTaskWithDueDate,
        expect.objectContaining({
          recurrence: {
            frequency: 'weekly',
            interval: 2,
            weekDays: [1, 5], // Monday, Friday
          },
        })
      );
    });
  });

  // Test case for simple task completion
  it('should call onComplete when the checkbox is clicked', async () => {
    const handleComplete = jest.fn();

    render(
      <TaskRow
        task={mockTask}
        allTasks={[]}
        tags={mockTags}
        onComplete={handleComplete}
        onFocus={jest.fn()}
      />
    );

    // Find the completion button by its accessible name (aria-label)
    const completeButton = screen.getByRole('button', { name: 'Complete task' });
    fireEvent.click(completeButton);

    // Assert that the callback was fired correctly
    await waitFor(() => {
        expect(handleComplete).toHaveBeenCalledTimes(1);
        expect(handleComplete).toHaveBeenCalledWith(mockTask);
    });
  });
});
