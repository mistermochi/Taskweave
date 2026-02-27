/**
 * @file Unit tests for time and recurrence utilities.
 * Verifies the logic for calculating next occurrence dates for
 * various recurrence patterns (daily, weekly, monthly).
 */

import { calculateTaskTime, formatTimer, getNextRecurrenceDate } from '@/shared/lib/timeUtils';
import { TaskEntity, RecurrenceConfig } from '@/entities/task';

// Mock Date.now() to ensure consistent test results
const MOCK_NOW = new Date('2024-01-01T12:00:00Z').getTime();
jest.useFakeTimers().setSystemTime(MOCK_NOW);

describe('timeUtils', () => {
  describe('formatTimer', () => {
    it('formats positive seconds correctly', () => {
      expect(formatTimer(1500)).toBe('25:00'); // 25 mins
      expect(formatTimer(59)).toBe('00:59');
      expect(formatTimer(3661)).toBe('61:01');
    });

    it('formats negative seconds correctly (overtime)', () => {
      expect(formatTimer(-1)).toBe('+00:01');
      expect(formatTimer(-60)).toBe('+01:00');
    });
  });

  describe('calculateTaskTime', () => {
    const baseTask: TaskEntity = {
      id: 'task-1',
      title: 'Test Task',
      status: 'active',
      duration: 25, // 25 minutes = 1500 seconds
      energy: 'Medium',
      category: 'Work',
      createdAt: MOCK_NOW - 100000,
    } as TaskEntity;

    it('should return correct metrics for an IDLE task', () => {
      const metrics = calculateTaskTime(baseTask);
      expect(metrics.status).toBe('idle');
      expect(metrics.totalSeconds).toBe(1500);
      expect(metrics.remaining).toBe(1500);
      expect(metrics.elapsed).toBe(0);
      expect(metrics.progress).toBe(0);
    });

    it('should return correct metrics for a PAUSED task', () => {
      const pausedTask: TaskEntity = {
        ...baseTask,
        remainingSeconds: 900, // Paused with 15 mins remaining
      };
      const metrics = calculateTaskTime(pausedTask);
      expect(metrics.status).toBe('paused');
      expect(metrics.remaining).toBe(900);
      expect(metrics.elapsed).toBe(600); // 1500 - 900
      expect(metrics.progress).toBe(0.4); // 600 / 1500
    });

    it('should return correct metrics for a RUNNING task', () => {
      const runningTask: TaskEntity = {
        ...baseTask,
        remainingSeconds: 900, // Was paused with 15 mins left
        lastStartedAt: MOCK_NOW - 300000, // ...and resumed 5 mins (300s) ago
      };
      const metrics = calculateTaskTime(runningTask);
      expect(metrics.status).toBe('running');
      expect(metrics.totalSeconds).toBe(1500);

      // Expected remaining: 900s (from snapshot) - 300s (since resume) = 600s
      expect(metrics.remaining).toBe(600);
      // Expected elapsed: 1500s (total) - 600s (remaining) = 900s
      expect(metrics.elapsed).toBe(900);
      expect(metrics.progress).toBe(0.6); // 900 / 1500
    });
  });

  describe('getNextRecurrenceDate', () => {
    // Set a consistent start date for all tests: Wednesday, March 27, 2024
    const baseDate = new Date('2024-03-27T10:00:00Z');
    const baseTimestamp = baseDate.getTime();

    // Set 'now' to be the same as the base date for this test suite
    beforeAll(() => {
        jest.useFakeTimers().setSystemTime(baseDate);
    });

    // After this suite, revert to the global mock time for other test suites
    afterAll(() => {
        jest.useFakeTimers().setSystemTime(MOCK_NOW);
    });

    it('should calculate the next daily recurrence', () => {
        const config: RecurrenceConfig = { frequency: 'daily', interval: 1 };
        const nextDate = new Date(getNextRecurrenceDate(baseTimestamp, config));
        // Expect: March 28, 2024
        expect(nextDate.toISOString().split('T')[0]).toBe('2024-03-28');
    });

    it('should calculate the next recurrence for every 3 days', () => {
        const config: RecurrenceConfig = { frequency: 'daily', interval: 3 };
        const nextDate = new Date(getNextRecurrenceDate(baseTimestamp, config));
        // Expect: March 30, 2024
        expect(nextDate.toISOString().split('T')[0]).toBe('2024-03-30');
    });

    it('should calculate the next weekly recurrence on the same day', () => {
        const config: RecurrenceConfig = { frequency: 'weekly', interval: 1 };
        const nextDate = new Date(getNextRecurrenceDate(baseTimestamp, config));
        // Expect: April 3, 2024 (next Wednesday)
        expect(nextDate.toISOString().split('T')[0]).toBe('2024-04-03');
    });

    it('should calculate the next bi-weekly recurrence', () => {
        const config: RecurrenceConfig = { frequency: 'weekly', interval: 2 };
        const nextDate = new Date(getNextRecurrenceDate(baseTimestamp, config));
        // Expect: April 10, 2024 (2 weeks after March 27)
        expect(nextDate.toISOString().split('T')[0]).toBe('2024-04-10');
    });

    it('should calculate the next multi-day weekly recurrence (Mon, Wed, Fri)', () => {
        const config: RecurrenceConfig = { frequency: 'weekly', interval: 1, weekDays: [1, 3, 5] }; // Mon, Wed, Fri
        // Base is a Wednesday, so next is Friday
        const nextDate = new Date(getNextRecurrenceDate(baseTimestamp, config));
        // Expect: March 29, 2024 (Friday)
        expect(nextDate.toISOString().split('T')[0]).toBe('2024-03-29');
    });

    it('should handle weekly wrap-around', () => {
        const friBase = new Date('2024-03-29T10:00:00Z').getTime(); // Friday
        const config: RecurrenceConfig = { frequency: 'weekly', interval: 1, weekDays: [1, 3, 5] }; // Mon, Wed, Fri
        const nextDate = new Date(getNextRecurrenceDate(friBase, config));
        // Expect: April 1, 2024 (next Monday)
        expect(nextDate.toISOString().split('T')[0]).toBe('2024-04-01');
    });

    it('should calculate the next monthly recurrence on the same date', () => {
        const config: RecurrenceConfig = { frequency: 'monthly', interval: 1 };
        const nextDate = new Date(getNextRecurrenceDate(baseTimestamp, config));
        // Expect: April 27, 2024
        expect(nextDate.toISOString().split('T')[0]).toBe('2024-04-27');
    });

    it('should handle monthly recurrence from a long month to a short one', () => {
        const jan31 = new Date('2024-01-31T10:00:00Z').getTime();
        const config: RecurrenceConfig = { frequency: 'monthly', interval: 1 };
        // From Jan 31, the next recurrence is Feb 29. Since 'now' is Mar 27, the loop continues.
        // The next recurrence from Feb 29 is Mar 29.
        const nextDate = new Date(getNextRecurrenceDate(jan31, config));
        expect(nextDate.toISOString().split('T')[0]).toBe('2024-03-29');
    });

    it('should calculate the next relative monthly recurrence (4th Wednesday)', () => {
        const config: RecurrenceConfig = {
            frequency: 'monthly',
            interval: 1,
            monthlyType: 'relative',
            weekOfMonth: 4, // 4th
            weekDays: [3],    // Wednesday
        };
        const nextDate = new Date(getNextRecurrenceDate(baseTimestamp, config));
        // Base is 4th Wed of March. Next is 4th Wed of April.
        // April 2024: 1st is Monday. So Wed are 3, 10, 17, 24. 4th is April 24.
        expect(nextDate.toISOString().split('T')[0]).toBe('2024-04-24');
    });

    it('should calculate the next relative monthly recurrence for the last weekday', () => {
        const config: RecurrenceConfig = {
            frequency: 'monthly',
            interval: 1,
            monthlyType: 'relative',
            weekOfMonth: 5, // Last
            weekDays: [5],    // Friday
        };
        const nextDate = new Date(getNextRecurrenceDate(baseTimestamp, config));
        // Base is Mar 27. Last Friday in April is Apr 26.
        expect(nextDate.toISOString().split('T')[0]).toBe('2024-04-26');
    });

    it('should calculate the next relative monthly recurrence for the last day of the month', () => {
        const config: RecurrenceConfig = {
            frequency: 'monthly',
            interval: 1,
            monthlyType: 'relative',
            weekOfMonth: 5, // Last
            weekDays: [0],    // Sunday
        };
        // Base is Mar 27. Last Sunday in April 2024 is the 28th.
        const nextDate = new Date(getNextRecurrenceDate(baseTimestamp, config));
        expect(nextDate.toISOString().split('T')[0]).toBe('2024-04-28');

        // From Last Sunday in March, next is Last Sunday in April
        const fromLastSun = new Date('2024-03-31T10:00:00Z').getTime();
        const nextFromLastSun = new Date(getNextRecurrenceDate(fromLastSun, config));
        expect(nextFromLastSun.toISOString().split('T')[0]).toBe('2024-04-28');
    });

    it('should calculate the next yearly recurrence', () => {
        const config: RecurrenceConfig = { frequency: 'yearly', interval: 1 };
        const nextDate = new Date(getNextRecurrenceDate(baseTimestamp, config));
        // Expect: March 27, 2025
        expect(nextDate.toISOString().split('T')[0]).toBe('2025-03-27');
    });

    it('should calculate the next bi-yearly recurrence', () => {
        const config: RecurrenceConfig = { frequency: 'yearly', interval: 2 };
        const nextDate = new Date(getNextRecurrenceDate(baseTimestamp, config));
        // Expect: March 27, 2026
        expect(nextDate.toISOString().split('T')[0]).toBe('2026-03-27');
    });

    it('should handle catch-up for past due recurring dates', () => {
        // Set 'now' to be far in the future
        jest.setSystemTime(new Date('2024-05-01T10:00:00Z'));

        const config: RecurrenceConfig = { frequency: 'daily', interval: 1 };
        // Base date is March 27, but 'now' is May 1. Next should be May 2.
        const nextDate = new Date(getNextRecurrenceDate(baseTimestamp, config));

        expect(nextDate.toISOString().split('T')[0]).toBe('2024-05-02');

        // Reset time for other tests in this suite
        jest.setSystemTime(baseDate);
    });
  });
});
