/**
 * @file Unit tests for NavigationContext.
 * These tests verify the state management for view transitions,
 * focus session target tracking, and modal visibility.
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { NavigationProvider, useNavigation } from '../context/NavigationContext';
import { ViewName } from '../types';

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NavigationProvider>{children}</NavigationProvider>
);

describe('NavigationContext', () => {
  /**
   * Test Case: Initialization.
   * Verifies that the app starts on the Database view with no active task.
   */
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useNavigation(), { wrapper });

    expect(result.current.currentView).toBe(ViewName.DATABASE);
    expect(result.current.activeTaskId).toBeUndefined();
    expect(result.current.isFocusExpanded).toBe(false);
  });

  /**
   * Test Suite: Focus Session Flow.
   * Verifies navigation actions related to starting and stopping focus sessions.
   */
  describe('Focus Session Flow', () => {
      it('should start a focus session correctly', () => {
          const { result } = renderHook(() => useNavigation(), { wrapper });

          act(() => {
              result.current.focusOnTask('task-focus-1');
          });

          expect(result.current.activeTaskId).toBe('task-focus-1');
      });

      it('should complete a focus session and set summary task id', () => {
          const { result } = renderHook(() => useNavigation(), { wrapper });

          act(() => {
              result.current.focusOnTask('task-focus-3');
          });

          act(() => {
              result.current.completeFocusSession('task-focus-3');
          });

          expect(result.current.activeTaskId).toBeUndefined();
          expect(result.current.summaryTaskId).toBe('task-focus-3');
      });
  });

  /**
   * Test Suite: Break Mode Flow.
   * Verifies that the context correctly remembers the previous view when
   * entering an immersive wellbeing state (Breathing/Grounding).
   */
  describe('Break Mode Memory Flow', () => {
      it('should remember the previous view when starting a break', () => {
          const { result } = renderHook(() => useNavigation(), { wrapper });

          act(() => {
              result.current.showDashboard();
          });

          act(() => {
              result.current.startBreathing();
          });

          expect(result.current.currentView).toBe(ViewName.BREATHING);
          expect(result.current.previousView).toBe(ViewName.DASHBOARD);
      });
  });
});
