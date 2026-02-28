
/**
 * @file Unit tests for TaskRow component.
 * Verifies that task information is displayed correctly and that
 * user interactions (complete, focus, edit) trigger the expected actions.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock firebase before anything else
jest.mock('@/shared/api/firebase', () => ({
  auth: {},
  db: {},
}));

import { TaskRow } from '@/entities/task';
import { TaskEntity } from '@/entities/task';
import { Tag } from '../entities/tag';

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
jest.mock('../entities/tag', () => ({
  tagApi: {
    createTag: jest.fn().mockResolvedValue('new-tag-id'),
    deleteTag: jest.fn(),
    updateTag: jest.fn(),
    moveTag: jest.fn(),
    getTags: jest.fn().mockResolvedValue([]),
  },
}));

describe('TaskRow - Basic UI', () => {
  const mockTask: TaskEntity = {
    id: 'task-1',
    title: 'A task to be tested',
    status: 'active',
    duration: 30,
    energy: 'Medium',
    category: 'tag-work',
    blockedBy: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockTags: Tag[] = [
    { id: 'tag-work', name: 'Work', color: '#c084fc', parentId: null, order: 0 },
  ];

  it('renders task title and metadata badges', () => {
    render(
      <TaskRow
        task={mockTask}
        allTasks={[]}
        tags={mockTags}
        onComplete={jest.fn()}
        onFocus={jest.fn()}
      />
    );

    expect(screen.getByText('A task to be tested')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('30m')).toBeInTheDocument();
    expect(screen.getByText('Med')).toBeInTheDocument();
  });

  it('calls onComplete when the checkbox is clicked', async () => {
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

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(handleComplete).toHaveBeenCalledWith(mockTask);
    });
  });

  it('opens the edit sheet when clicking the row', async () => {
    render(
      <TaskRow
        task={mockTask}
        allTasks={[]}
        tags={mockTags}
        onComplete={jest.fn()}
        onFocus={jest.fn()}
        onUpdate={jest.fn()}
      />
    );

    const row = screen.getByText('A task to be tested');
    fireEvent.click(row);

    // Should see the sheet title
    expect(await screen.findByText('Task Details')).toBeInTheDocument();
    // Should see the title in the input
    expect(screen.getByDisplayValue('A task to be tested')).toBeInTheDocument();
  });
});

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

  it('should disable the checkbox if a task is blocked', () => {
      render(
          <TaskRow
              task={blockedTask}
              allTasks={allTasks}
              tags={mockTags}
              onComplete={jest.fn()}
              onFocus={jest.fn()}
          />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
  });
});
