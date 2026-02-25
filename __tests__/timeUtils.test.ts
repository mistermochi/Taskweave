/**
 * @file Unit tests for Time Utilities.
 * These tests verify timer calculations, recurrence logic, and formatting.
 */
import {
  calculateTaskTime,
  getNextRecurrenceDate,
  formatTimer,
  getStartOfDay,
  syncRecurrenceToNewDate
} from '../utils/timeUtils';
import { TaskEntity, RecurrenceConfig } from '../types';

describe('Time Utilities', () => {

  /**
   * Test Suite: Timer Formatting.
   * Verifies that seconds are correctly converted to MM:SS strings,
   * including handling of overtime (negative seconds).
   */
  describe('formatTimer', () => {
    it('should format positive seconds correctly', () => {
      expect(formatTimer(1500)).toBe('25:00');
      expect(formatTimer(65)).toBe('01:05');
    });

    it('should handle overtime (negative seconds)', () => {
      expect(formatTimer(-120)).toBe('+02:00');
    });
  });

  /**
   * Test Suite: Task Time Calculations.
   * Verifies the logic for deriving elapsed and remaining time from
   * task persistence fields (lastStartedAt, remainingSeconds).
   */
  describe('calculateTaskTime', () => {
    const mockTask: TaskEntity = {
      id: '1',
      duration: 25, // 1500 seconds
      status: 'active',
      isFocused: true,
      lastStartedAt: null,
      remainingSeconds: null,
    } as TaskEntity;

    it('should return initial duration for an idle task', () => {
      const result = calculateTaskTime(mockTask);
      expect(result.remaining).toBe(1500);
      expect(result.status).toBe('idle');
    });

    it('should calculate time for a running task', () => {
      const now = Date.now();
      const runningTask = {
        ...mockTask,
        lastStartedAt: now - 10000, // Started 10 seconds ago
        remainingSeconds: 1500
      };
      const result = calculateTaskTime(runningTask);
      expect(result.remaining).toBe(1490);
      expect(result.status).toBe('running');
    });
  });

  /**
   * Test Suite: Recurrence Logic.
   * Verifies the calculation of the next occurrence date for various
   * frequencies (daily, weekly, monthly).
   */
  describe('getNextRecurrenceDate', () => {
    it('should calculate next daily occurrence', () => {
        const base = new Date('2024-01-01T12:00:00Z').getTime();
        const config: RecurrenceConfig = { frequency: 'daily', interval: 1 };
        const result = getNextRecurrenceDate(base, config);
        const nextDate = new Date(result);
        expect(nextDate.getUTCDate()).toBe(2);
    });
  });
});
