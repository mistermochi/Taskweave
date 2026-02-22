
'use client';

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSessionSummaryController } from '../hooks/controllers/useSessionSummaryController';
import { useUserId, useFirestoreDoc } from '../hooks/useFirestore';
import { TaskService } from '../services/TaskService';
import { useEnergyModel } from '../hooks/useEnergyModel';

// Mock dependencies
jest.mock('../hooks/useFirestore');
jest.mock('../services/TaskService');
jest.mock('../hooks/useEnergyModel');

const mockUseUserId = useUserId as jest.Mock;
const mockUseFirestoreDoc = useFirestoreDoc as jest.Mock;
const mockUseEnergyModel = useEnergyModel as jest.Mock;

const mockTaskServiceInstance = {
  logSessionCompletion: jest.fn(),
};

jest.mock('../services/TaskService', () => ({
  TaskService: {
    getInstance: () => mockTaskServiceInstance,
  },
}));

const mockTask = {
  id: 'task-1',
  title: 'Test Summary',
  status: 'completed',
  duration: 25, // planned minutes
  actualDuration: 1800, // actual seconds (30 mins)
  energy: 'Medium',
  category: 'Work',
  createdAt: Date.now(),
};

describe('useSessionSummaryController', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    mockUseUserId.mockReturnValue('test-uid');
    mockUseFirestoreDoc.mockReturnValue({
        data: mockTask,
        loading: false,
    });
    mockUseEnergyModel.mockReturnValue({
        currentEnergy: 70, // Start with a baseline energy
        moodIndex: 4,
        hasEntry: true,
        lastUpdated: Date.now()
    });
  });

  it('should initialize with the correct task and calculate time difference based on actualDuration', async () => {
    const { result } = renderHook(() => useSessionSummaryController('task-1'));

    await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
    });

    expect(result.current.state.task).toEqual(mockTask);
    // planned: 25m = 1500s. actual: 1800s. diff = 300s
    expect(result.current.state.timeDifference).toBe(300);
    expect(result.current.state.getTimeChipText()).toBe('30m');
  });

  it('should fall back to planned duration if actualDuration is not present', async () => {
    const taskWithoutActual = { ...mockTask, actualDuration: null };
    mockUseFirestoreDoc.mockReturnValue({ data: taskWithoutActual, loading: false });

    const { result } = renderHook(() => useSessionSummaryController('task-1'));

    await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
    });
    
    // planned: 25m = 1500s. actual is null, so fallback is 1500s. diff = 0.
    expect(result.current.state.timeDifference).toBe(0);
    expect(result.current.state.getTimeChipText()).toBe('25m');
  });

  it('should return null task if taskId is undefined', async () => {
    mockUseFirestoreDoc.mockReturnValue({ data: null, loading: false });
    const { result } = renderHook(() => useSessionSummaryController(undefined));
    
    await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
    });

    expect(result.current.state.task).toBe(null);
  });

  it('should update mood and recalculate energyDelta', async () => {
    const { result } = renderHook(() => useSessionSummaryController('task-1'));
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    const initialDelta = result.current.state.energyDelta; // For Neutral mood

    act(() => { result.current.actions.setMood('Energized'); });

    const energizedDelta = result.current.state.energyDelta;
    expect(result.current.state.mood).toBe('Energized');
    expect(energizedDelta).toBeGreaterThan(initialDelta);

    act(() => { result.current.actions.setMood('Drained'); });

    const drainedDelta = result.current.state.energyDelta;
    expect(result.current.state.mood).toBe('Drained');
    expect(drainedDelta).toBeLessThan(initialDelta);
  });

  it('should call finishSession and log completion with correct data', async () => {
    const { result } = renderHook(() => useSessionSummaryController('task-1'));
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    act(() => {
        result.current.actions.setMood('Drained');
        result.current.actions.setNotes('Felt difficult.');
    });

    await act(async () => {
      await result.current.actions.finishSession();
    });

    expect(mockTaskServiceInstance.logSessionCompletion).toHaveBeenCalledTimes(1);
    expect(mockTaskServiceInstance.logSessionCompletion).toHaveBeenCalledWith(
        mockTask,
        'Drained',
        'Felt difficult.',
        expect.any(Number)
    );
  });
});
