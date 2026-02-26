
/**
 * @file Unit tests for useTaskDatabaseController.
 * Verifies the logic for task categorization (sections), searching,
 * and AI-informed sorting within the task database.
 */

import { renderHook, act } from '@testing-library/react';
import { useTaskDatabaseController } from '../hooks/controllers/useTaskDatabaseController';
import { useTaskContext } from '../context/TaskContext';
import { useReferenceContext } from '../context/ReferenceContext';
import { useEnergyModel } from '../hooks/useEnergyModel';
import { useUserId, useFirestoreCollection } from '../hooks/useFirestore';
import { TaskEntity } from '../types';
import { RecommendationEngine } from '../services/RecommendationEngine';

// Mock dependencies

// Global firebase mock to prevent init errors
jest.mock('../firebase', () => ({
  auth: {},
  db: {},
}));

jest.mock('../context/TaskContext');
jest.mock('../context/ReferenceContext');
jest.mock('../hooks/useEnergyModel');
jest.mock('../hooks/useFirestore', () => ({
  ...jest.requireActual('../hooks/useFirestore'),
  useUserId: jest.fn().mockReturnValue('test-uid'),
  useFirestoreCollection: jest.fn().mockReturnValue({ data: [], loading: false }),
}));
jest.mock('../services/RecommendationEngine');

const mockUseTaskContext = useTaskContext as jest.Mock;
const mockUseReferenceContext = useReferenceContext as jest.Mock;
const mockUseEnergyModel = useEnergyModel as jest.Mock;
const mockUseUserId = useUserId as jest.Mock;
const mockUseFirestoreCollection = useFirestoreCollection as jest.Mock;
const mockGetInstance = jest.fn();
RecommendationEngine.getInstance = mockGetInstance;


describe('useTaskDatabaseController - Task Section Logic', () => {

  const now = new Date('2024-08-15T10:00:00Z'); // Thursday
  const startOfToday = new Date('2024-08-15T00:00:00Z').getTime();
  const endOfToday = new Date('2024-08-15T23:59:59Z').getTime();

  // --- MOCK TASKS ---
  const overdueTask: TaskEntity = { id: 'task-overdue', title: 'Way Past Due', status: 'active', dueDate: startOfToday - 86400000, duration: 30, energy: 'Medium', category: 'Work', createdAt: Date.now() } as TaskEntity;
  const dueTodayTask: TaskEntity = { id: 'task-due-today', title: 'Due Today', status: 'active', dueDate: startOfToday + 3600000, duration: 30, energy: 'Medium', category: 'Work', createdAt: Date.now() } as TaskEntity;
  const assignedTodayTask: TaskEntity = { id: 'task-assigned-today', title: 'Planned for Today', status: 'active', assignedDate: startOfToday + 1800000, duration: 30, energy: 'Medium', category: 'Work', createdAt: Date.now() } as TaskEntity;
  const upcomingTask: TaskEntity = { id: 'task-upcoming', title: 'Planned for Tomorrow', status: 'active', assignedDate: endOfToday + 86400000, duration: 30, energy: 'Medium', category: 'Work', createdAt: Date.now() } as TaskEntity;
  const inboxTask: TaskEntity = { id: 'task-inbox', title: 'Unplanned Task', status: 'active', duration: 30, energy: 'Medium', category: 'Work', createdAt: Date.now() } as TaskEntity;
  const focusedTask: TaskEntity = { id: 'task-focused', title: 'Currently Focused Task', status: 'active', isFocused: true, duration: 30, energy: 'Medium', category: 'Work', createdAt: Date.now() } as TaskEntity;
  // This task is BOTH overdue AND assigned to today. It should ONLY appear in 'today'.
  const overdueAndAssignedTodayTask: TaskEntity = { id: 'task-overdue-and-today', title: 'Overdue but planned for today', status: 'active', dueDate: startOfToday - 86400000, assignedDate: startOfToday + 7200000, duration: 30, energy: 'Medium', category: 'Work', createdAt: Date.now() } as TaskEntity;
  // Ensure different createdAt for stable sorting in tests
  const completedTask: TaskEntity = { id: 'task-completed', title: 'Finished task', status: 'completed', completedAt: startOfToday - 1, duration: 30, energy: 'Medium', category: 'Work', createdAt: Date.now() - 1000 } as TaskEntity;

  const allMockTasks = [
      overdueTask,
      dueTodayTask,
      assignedTodayTask,
      upcomingTask,
      inboxTask,
      focusedTask,
      overdueAndAssignedTodayTask,
      completedTask
  ];

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(now);

    mockUseUserId.mockReturnValue('test-uid');
    mockUseReferenceContext.mockReturnValue({ tags: [] });
    mockUseEnergyModel.mockReturnValue({ currentEnergy: 75 });

    // Mock the RecommendationEngine to prevent it from running in tests
    mockGetInstance.mockReturnValue({
        generateSuggestion: jest.fn().mockResolvedValue({ suggestion: null })
    });
  });

  afterEach(() => {
      jest.useRealTimers();
  });

  it('should correctly prioritize tasks assigned to Today, even if they are overdue', () => {
    mockUseTaskContext.mockReturnValue({ tasks: allMockTasks });
    const { result } = renderHook(() => useTaskDatabaseController(null));

    const { sections } = result.current.state;

    // 1. Check the 'today' section - should contain focused, assigned today, and the special case
    expect(sections.today.map(t => t.id)).toContain('task-assigned-today');
    expect(sections.today.map(t => t.id)).toContain('task-focused');
    expect(sections.today.map(t => t.id)).toContain('task-overdue-and-today');
    expect(sections.today).toHaveLength(3);

    // 2. Check the 'overdue' section - should contain overdue tasks that are NOT in 'today'
    expect(sections.overdue.map(t => t.id)).toContain('task-overdue');
    expect(sections.overdue.map(t => t.id)).toContain('task-due-today');
    expect(sections.overdue).toHaveLength(2);
    // CRITICAL: Ensure the special case task is NOT here
    expect(sections.overdue.map(t => t.id)).not.toContain('task-overdue-and-today');

    // 3. Check other sections
    expect(sections.upcoming.map(t => t.id)).toEqual(['task-upcoming']);
    expect(sections.inbox.map(t => t.id)).toEqual(['task-inbox', 'task-completed']);

    // 4. Verify no task appears in more than one section
    const allSectionTasks = [
        ...sections.today,
        ...sections.overdue,
        ...sections.upcoming,
        ...sections.inbox,
    ];
    const uniqueIds = new Set(allSectionTasks.map(t => t.id));
    expect(uniqueIds.size).toBe(allSectionTasks.length);
  });
});

describe('useTaskDatabaseController - Search and Filtering', () => {
    const mockTasks: TaskEntity[] = [
        { id: 'task-1', title: 'Design the new logo', notes: 'Finalize color palette', status: 'active', category: 'work', createdAt: 1 } as TaskEntity,
        { id: 'task-2', title: 'Book dentist appointment', notes: 'Check for morning slots', status: 'active', category: 'personal', createdAt: 2 } as TaskEntity,
        { id: 'task-3', title: 'Weekly review', notes: 'Review logo and finances', status: 'active', category: 'work', createdAt: 3 } as TaskEntity,
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseUserId.mockReturnValue('test-uid');
        mockUseReferenceContext.mockReturnValue({ tags: [] });
        mockUseEnergyModel.mockReturnValue({ currentEnergy: 75 });
        mockGetInstance.mockReturnValue({
            generateSuggestion: jest.fn().mockResolvedValue({ suggestion: null })
        });
        mockUseTaskContext.mockReturnValue({ tasks: mockTasks });
    });

    it('should filter tasks by title search query', () => {
        const { result } = renderHook(() => useTaskDatabaseController(null));

        act(() => {
            result.current.actions.setSearchQuery('dentist');
        });

        // 'inbox' is where these tasks will appear as they have no dates
        const { inbox } = result.current.state.sections;
        expect(inbox.length).toBe(1);
        expect(inbox[0].id).toBe('task-2');
    });

    it('should filter tasks by notes search query', () => {
        const { result } = renderHook(() => useTaskDatabaseController(null));

        act(() => {
            result.current.actions.setSearchQuery('slots');
        });

        const { inbox } = result.current.state.sections;
        expect(inbox.length).toBe(1);
        expect(inbox[0].id).toBe('task-2');
    });

    it('should filter by a query matching both title and notes across multiple tasks', () => {
        const { result } = renderHook(() => useTaskDatabaseController(null));

        act(() => {
            result.current.actions.setSearchQuery('logo');
        });

        const { inbox } = result.current.state.sections;
        expect(inbox.length).toBe(2);
        const taskIds = inbox.map(t => t.id);
        expect(taskIds).toContain('task-1'); // 'logo' in title
        expect(taskIds).toContain('task-3'); // 'logo' in notes
    });

    it('should return no tasks if query does not match', () => {
        const { result } = renderHook(() => useTaskDatabaseController(null));

        act(() => {
            result.current.actions.setSearchQuery('nonexistent');
        });

        const { sections } = result.current.state;
        expect(sections.inbox.length).toBe(0);
        expect(sections.today.length).toBe(0);
        expect(sections.overdue.length).toBe(0);
    });

    it('should perform a case-insensitive search', () => {
        const { result } = renderHook(() => useTaskDatabaseController(null));

        act(() => {
            result.current.actions.setSearchQuery('DENTIST');
        });

        const { inbox } = result.current.state.sections;
        expect(inbox.length).toBe(1);
        expect(inbox[0].id).toBe('task-2');
    });
});

describe('useTaskDatabaseController - Inbox Sorting Logic', () => {
    const now = Date.now();

    // Base tasks, all in inbox (no assignedDate, no dueDate within 2 weeks)
    // t5 and t6 have dueDates too far in future - they go to upcoming
    // We need tasks WITHOUT dueDates for inbox sorting tests
    const taskOldest = { id: 't1', title: 'Oldest', status: 'active', duration: 30, createdAt: now - 50000, category: '' } as TaskEntity;
    const taskNewest = { id: 't2', title: 'Newest', status: 'active', duration: 30, createdAt: now, category: '' } as TaskEntity;
    const taskShort = { id: 't3', title: 'Short', status: 'active', duration: 5, createdAt: now - 10000, category: '' } as TaskEntity;
    const taskLong = { id: 't4', title: 'Long', status: 'active', duration: 90, createdAt: now - 20000, category: '' } as TaskEntity;
    const taskRecommended = { id: 't7', title: 'Recommended', status: 'active', duration: 30, createdAt: now - 60000, category: '' } as TaskEntity;

    const allInboxTasks = [taskOldest, taskNewest, taskShort, taskLong, taskRecommended];

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseUserId.mockReturnValue('test-uid');
        mockUseReferenceContext.mockReturnValue({ tags: [] });
        mockUseEnergyModel.mockReturnValue({ currentEnergy: 75 });
    });

    it('should sort the inbox with AI recommendation at the top', async () => {
        // Arrange
        mockUseTaskContext.mockReturnValue({ tasks: allInboxTasks });
        mockGetInstance.mockReturnValue({
            generateSuggestion: jest.fn().mockResolvedValue({
                suggestion: { type: 'task', taskId: 't7', reason: 'test' },
                strategy: 'test'
            })
        });

        // Act
        const { result, rerender } = renderHook(() => useTaskDatabaseController(null));
        await act(async () => {
            rerender();
        });

        // Assert
        const { inbox } = result.current.state.sections;
        expect(inbox[0].id).toBe('t7');
    });

    it('should sort by duration (shortest first) as the primary sort for inbox', async () => {
        // Arrange
        mockUseTaskContext.mockReturnValue({ tasks: allInboxTasks });
        // No AI recommendation
        mockGetInstance.mockReturnValue({
            generateSuggestion: jest.fn().mockResolvedValue({ suggestion: null })
        });

        // Act
        const { result, rerender } = renderHook(() => useTaskDatabaseController(null));
        await act(async () => {
            rerender();
        });

        // Assert
        const { inbox } = result.current.state.sections;
        const ids = inbox.map(t => t.id);

        // Expected order by duration (shortest first): t3(5), t1(30), t2(30), t7(30), t4(90)
        // Then by recency for same duration: t2(newest), t1, t7(oldest)
        expect(ids).toEqual(['t3', 't2', 't1', 't7', 't4']);
    });

    it('should sort by recency (newest first) for tasks with same duration', async () => {
        // Arrange
        // Create tasks with same duration to test recency
        const taskA = { id: 'a', status: 'active', duration: 30, createdAt: now - 1000, category: '' } as TaskEntity;
        const taskB = { id: 'b', status: 'active', duration: 30, createdAt: now, category: '' } as TaskEntity;
        const taskC = { id: 'c', status: 'active', duration: 30, createdAt: now - 2000, category: '' } as TaskEntity;

        mockUseTaskContext.mockReturnValue({ tasks: [taskA, taskB, taskC] });
        mockGetInstance.mockReturnValue({
            generateSuggestion: jest.fn().mockResolvedValue({ suggestion: null })
        });

        // Act
        const { result, rerender } = renderHook(() => useTaskDatabaseController(null));
        await act(async () => {
            rerender();
        });

        // Assert
        const { inbox } = result.current.state.sections;
        // Expected order is newest to oldest: B, A, C
        expect(inbox.map(t => t.id)).toEqual(['b', 'a', 'c']);
    });

    it('should correctly combine all sorting criteria', async () => {
        // Arrange
        mockUseTaskContext.mockReturnValue({ tasks: allInboxTasks });
        mockGetInstance.mockReturnValue({
            generateSuggestion: jest.fn().mockResolvedValue({ suggestion: null })
        });

        // Act
        const { result, rerender } = renderHook(() => useTaskDatabaseController(null));
        await act(async () => {
            rerender();
        });

        // Assert
        const { inbox } = result.current.state.sections;
        // Sort by duration (shortest first): t3(5), then 30m tasks by recency, then t4(90)
        // 30m tasks by recency (newest first): t2(now), t1(now-50000), t7(now-60000)
        expect(inbox.map(t => t.id)).toEqual(['t3', 't2', 't1', 't7', 't4']);
    });
});
