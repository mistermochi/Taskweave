import React from 'react';
import { render, screen } from '@testing-library/react';
import { TaskList } from '../components/task-list';
import { Task } from '@/entities/task';
import { Tag } from '@/entities/tag';
import { useTaskAppStore } from '../use-task-app';
import { startOfToday, addDays, subDays } from 'date-fns';

jest.mock('../use-task-app');
const mockUseTaskAppStore = useTaskAppStore as unknown as jest.Mock;

describe('TaskList Sorting and Grouping', () => {
  const now = startOfToday();
  const todayTime = now.getTime();
  const tomorrowTime = addDays(now, 1).getTime();
  const overdueTime = subDays(now, 1).getTime();

  const mockTags: Tag[] = [];

  beforeEach(() => {
    mockUseTaskAppStore.mockReturnValue({
      selectedTask: null,
      setSelectedTask: jest.fn(),
    });
  });

  it('should group tasks into correct sections', () => {
    const items: Task[] = [
      { id: '1', title: 'Overdue Task', status: 'active', dueDate: overdueTime, createdAt: todayTime, duration: 30 } as Task,
      { id: '2', title: 'Today Task', status: 'active', assignedDate: todayTime + 1000, createdAt: todayTime, duration: 30 } as Task,
      { id: '3', title: 'Tomorrow Task', status: 'active', assignedDate: tomorrowTime, createdAt: todayTime, duration: 30 } as Task,
      { id: '4', title: 'Completed Task', status: 'completed', createdAt: todayTime, duration: 30 } as Task,
      { id: '5', title: 'Later Task', status: 'active', createdAt: todayTime, duration: 30 } as Task,
    ];

    render(<TaskList items={items} tags={mockTags} />);

    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Tomorrow')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Later')).toBeInTheDocument();
  });

  it('should sort Today section: focused first, then by assigned date', () => {
    const items: Task[] = [
      { id: '1', title: 'Later Today', status: 'active', assignedDate: todayTime + 5000, createdAt: todayTime, duration: 30 } as Task,
      { id: '2', title: 'Earlier Today', status: 'active', assignedDate: todayTime + 1000, createdAt: todayTime, duration: 30 } as Task,
      { id: '3', title: 'Focused Task', status: 'active', assignedDate: todayTime + 8000, isFocused: true, createdAt: todayTime, duration: 30 } as Task,
    ];

    render(<TaskList items={items} tags={mockTags} />);

    const titles = screen.getAllByText(/Task|Today/).map(el => el.textContent);
    // Sections labels are also matched by /Task|Today/ if they have those words, but our labels are "Today"
    // The task titles are "Later Today", "Earlier Today", "Focused Task"

    // Better to use a more specific way to get titles
    const taskElements = screen.getAllByRole('button');
    const taskTitles = taskElements.map(el => el.querySelector('.font-semibold')?.textContent);

    expect(taskTitles).toEqual(['Focused Task', 'Earlier Today', 'Later Today']);
  });

  it('should sort Later section: shortest duration first, then newest', () => {
      const today = Date.now();
      const items: Task[] = [
          { id: '1', title: 'Long Old', status: 'active', duration: 60, createdAt: today - 10000 } as Task,
          { id: '2', title: 'Short Old', status: 'active', duration: 10, createdAt: today - 5000 } as Task,
          { id: '3', title: 'Medium New', status: 'active', duration: 30, createdAt: today } as Task,
          { id: '4', title: 'Medium Old', status: 'active', duration: 30, createdAt: today - 2000 } as Task,
      ];

      render(<TaskList items={items} tags={mockTags} />);

      const taskElements = screen.getAllByRole('button');
      const taskTitles = taskElements.map(el => el.querySelector('.font-semibold')?.textContent);

      expect(taskTitles).toEqual(['Short Old', 'Medium New', 'Medium Old', 'Long Old']);
  });
});
