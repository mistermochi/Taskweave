import React, { PropsWithChildren } from 'react';
import { renderHook, act } from '@testing-library/react';
import { NavigationProvider, useNavigation } from '../context/NavigationContext';
import { ViewName } from '../types';

// Wrapper component to provide the context to the hook
const wrapper = ({ children }: PropsWithChildren) => <NavigationProvider>{children}</NavigationProvider>;

describe('NavigationContext', () => {

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useNavigation(), { wrapper });

    expect(result.current.currentView).toBe(ViewName.DATABASE); // Updated default
    expect(result.current.activeTaskId).toBeUndefined();
    expect(result.current.activeTagId).toBeNull();
    expect(result.current.isFocusExpanded).toBe(false);
  });

  // Test Suite for Focus Session Flow
  describe('Focus Session Flow', () => {
    it('should start a focus session correctly', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      act(() => {
        result.current.focusOnTask('task-focus-1');
      });

      expect(result.current.activeTaskId).toBe('task-focus-1');
      // Player should start minimized
      expect(result.current.isFocusExpanded).toBe(false);
    });

    it('should toggle focus expansion when a session is active', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      // Start a session first
      act(() => {
        result.current.focusOnTask('task-focus-2');
      });

      // Toggle to expand
      act(() => {
        result.current.toggleFocusExpansion();
      });
      expect(result.current.isFocusExpanded).toBe(true);

      // Toggle to minimize
      act(() => {
        result.current.toggleFocusExpansion();
      });
      expect(result.current.isFocusExpanded).toBe(false);
    });
    
    it('should not toggle expansion if no session is active', () => {
        const { result } = renderHook(() => useNavigation(), { wrapper });
  
        // No active task, so state should not change
        act(() => {
          result.current.toggleFocusExpansion();
        });
        expect(result.current.isFocusExpanded).toBe(false);
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
      expect(result.current.isFocusExpanded).toBe(false);
      expect(result.current.summaryTaskId).toBe('task-focus-3');
    });

    it('should hide the summary modal', () => {
        const { result } = renderHook(() => useNavigation(), { wrapper });
  
        act(() => {
          result.current.completeFocusSession('task-summary-1');
        });
        expect(result.current.summaryTaskId).toBe('task-summary-1');

        act(() => {
            result.current.hideSummary();
        });
        expect(result.current.summaryTaskId).toBeUndefined();
      });
  });

  // Test Suite for Break Mode "Memory"
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
    
    it('should return to the previous view after a break', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      // Go from DATABASE -> BREATHING
      act(() => {
        result.current.navigate(ViewName.DATABASE);
      });
      act(() => {
        result.current.startBreathing();
      });

      // Return
      act(() => {
        result.current.returnToPreviousView();
      });

      expect(result.current.currentView).toBe(ViewName.DATABASE);
      // Previous view history should be cleared
      expect(result.current.previousView).toBeUndefined();
    });

    it('should not store previousView for main navigation actions', () => {
        const { result } = renderHook(() => useNavigation(), { wrapper });
  
        act(() => {
          result.current.showDashboard();
        });
        act(() => {
            result.current.showDatabase();
        });
  
        expect(result.current.currentView).toBe(ViewName.DATABASE);
        // Navigating between main views should not set a "previous view" for breaks
        expect(result.current.previousView).toBeUndefined();
      });
  });

  // Test Suite for View/Filter Selection
  describe('View and Filter Selection Flow', () => {
    it('should select a tag and switch to database view', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      act(() => {
        result.current.showDashboard();
      });
      
      act(() => {
        result.current.selectTag('tag-work-1');
      });

      expect(result.current.currentView).toBe(ViewName.DATABASE);
      expect(result.current.activeTagId).toBe('tag-work-1');
    });

    it('should handle quick add task by switching view and setting section', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      act(() => {
        result.current.showDashboard();
      });
      
      act(() => {
        result.current.quickAddTask('today');
      });

      expect(result.current.currentView).toBe(ViewName.DATABASE);
      expect(result.current.autoCreateSection).toBe('today');
      // Should also clear the active tag filter
      expect(result.current.activeTagId).toBeNull();
    });

    it('should clear the autoCreateSection after it has been read', () => {
        const { result } = renderHook(() => useNavigation(), { wrapper });
        
        act(() => {
          result.current.quickAddTask('inbox');
        });
        expect(result.current.autoCreateSection).toBe('inbox');
        
        act(() => {
            result.current.clearAutoCreate();
        });
        expect(result.current.autoCreateSection).toBeNull();
    });
  });
});
