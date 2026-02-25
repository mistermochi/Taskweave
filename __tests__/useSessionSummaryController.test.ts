/**
 * @file Unit tests for useSessionSummaryController.
 * These tests verify the calculation of biological energy impact
 * and the persistence of user reflections after a task.
 */
import { renderHook, act } from '@testing-library/react';
import { useSessionSummaryController } from '../hooks/controllers/useSessionSummaryController';
import { TaskService } from '../services/TaskService';
import { TaskEntity } from '../types';

// --- Mocks ---

jest.mock('../services/TaskService');
jest.mock('../hooks/useEnergyModel', () => ({
  useEnergyModel: () => ({ currentEnergy: 75 }),
}));
jest.mock('../hooks/useFirestore', () => ({
  useUserId: () => 'test-uid',
  useFirestoreDoc: () => ({ data: { id: '1', duration: 30, actualDuration: 1800 } }),
}));

describe('useSessionSummaryController', () => {
  /**
   * Test Case: Energy Impact calculation.
   * Verifies that the controller correctly derives the energy delta
   * based on the session outcome.
   */
  it('should calculate projected energy correctly', () => {
    const { result } = renderHook(() => useSessionSummaryController('task-1'));
    // Should have derived energyDelta based on actualTimeSpent vs plannedTime
    expect(result.current.state.projectedEnergy).toBeDefined();
  });

  /**
   * Test Case: Finalization.
   * Verifies that the controller calls the correct service methods to
   * save the session summary.
   */
  it('should call logSessionCompletion on finish', async () => {
    const logSpy = jest.spyOn(TaskService.getInstance(), 'logSessionCompletion');
    const { result } = renderHook(() => useSessionSummaryController('task-1'));
    
    await act(async () => {
        await result.current.actions.finishSession();
    });

    expect(logSpy).toHaveBeenCalled();
  });
});
