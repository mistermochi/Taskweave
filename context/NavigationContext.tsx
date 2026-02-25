'use client';

import React, { createContext, useContext, useState, useTransition, PropsWithChildren } from 'react';
import { ViewName, NavigationParams } from '@/types';

/**
 * State representing the user's current position and interaction mode within the app.
 */
interface NavigationState {
  /** The currently active top-level view. */
  currentView: ViewName;
  /** The previous view, used for "Back" navigation from temporary states (like breathing). */
  previousView?: ViewName;
  /** ID of the task currently being focused on, if any. */
  activeTaskId?: string;
  /** ID of the tag currently being used as a filter in the database view. */
  activeTagId?: string | null;
  /** Whether the focus player is in its expanded (full-screen) mode. */
  isFocusExpanded: boolean;
  /** Whether a view transition is currently in progress. */
  isNavigating: boolean;
  /** Name of the section to automatically show/create when switching to database. */
  autoCreateSection: string | null;
  /** ID of the task for which the summary modal is being shown. */
  summaryTaskId?: string;
  /** Whether the quick-focus suggestion modal is visible. */
  isQuickFocusModalOpen: boolean;
}

/**
 * Available navigation actions for modifying the application state.
 */
interface NavigationActions {
  /** Navigates to a specific view with optional parameters. */
  navigate: (view: ViewName, params?: NavigationParams) => void;
  /** Reverts to the previous view in the history. */
  returnToPreviousView: () => void;
  /** Shortcut to show the dashboard. */
  showDashboard: () => void;
  /** Shortcut to show the database view, optionally filtered by tag. */
  showDatabase: (tagId?: string | null) => void;
  /** Shortcut to show the insights view. */
  showInsights: () => void;
  /** Shortcut to show the settings view. */
  showSettings: () => void;
  /** Shortcut to show the AI chat view. */
  showChat: () => void;
  /** Shortcut to show the task history view. */
  showTaskHistory: () => void;
  /** Sets a specific task as the active focus target. */
  focusOnTask: (taskId: string) => void;
  /** Toggles the focus player between minimized and expanded modes. */
  toggleFocusExpansion: () => void;
  /** Marks a focus session as complete and shows the summary for the given task. */
  completeFocusSession: (taskId?: string) => void;
  /** Resets the active focus session state. */
  clearFocusSession: () => void;
  /** Transitions to the breathing exercise view. */
  startBreathing: () => void;
  /** Transitions to the sensory grounding exercise view. */
  startGrounding: () => void;
  /** Navigates to the database and triggers a quick-add flow for a specific section. */
  quickAddTask: (section?: string) => void;
  /** Clears the auto-create section flag. */
  clearAutoCreate: () => void;
  /** Sets the active tag filter. */
  selectTag: (tagId: string | null) => void;
  /** Hides the task completion summary modal. */
  hideSummary: () => void;
  /** Opens the quick-focus suggestion modal. */
  openQuickFocusModal: () => void;
  /** Closes the quick-focus suggestion modal. */
  closeQuickFocusModal: () => void;
}

type NavigationContextType = NavigationState & NavigationActions;

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

/**
 * Provider component that manages the global navigation state.
 * It coordinates view transitions, focus session states, and modal visibility.
 * Uses `useTransition` to maintain UI responsiveness during heavy view switches.
 *
 * @param children - The component tree that requires navigation access.
 */
export const NavigationProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [state, setState] = useState<Omit<NavigationState, 'isNavigating'>>({
    currentView: ViewName.DATABASE,
    previousView: undefined,
    activeTaskId: undefined,
    activeTagId: null,
    isFocusExpanded: false,
    autoCreateSection: null,
    summaryTaskId: undefined,
    isQuickFocusModalOpen: false,
  });
  const [isPending, startTransition] = useTransition();

  const navigate: NavigationActions['navigate'] = (view, params) => {
    startTransition(() => {
        setState(prevState => {
            const newState: Omit<NavigationState, 'isNavigating'> = { ...prevState, currentView: view };
            
            // Clear previous view history when navigating to a main view
            if (![ViewName.BREATHING, ViewName.SENSORY_GROUNDING].includes(view)) {
                newState.previousView = undefined;
            }
            
            return newState;
        });
    });
  };

  const returnToPreviousView = () => {
    startTransition(() => {
        setState(prevState => ({
            ...prevState,
            currentView: prevState.previousView || ViewName.DASHBOARD,
            previousView: undefined,
        }));
    });
  };

  const clearFocusSession = () => {
    startTransition(() => {
        setState(prevState => ({
            ...prevState,
            activeTaskId: undefined,
            isFocusExpanded: false,
            summaryTaskId: undefined,
        }));
    });
  };

  const actions: Omit<NavigationActions, 'navigate' | 'returnToPreviousView' | 'clearFocusSession'> = {
    showDashboard: () => navigate(ViewName.DASHBOARD),
    showDatabase: (tagId) => {
        startTransition(() => {
            setState(prevState => ({
                ...prevState,
                currentView: ViewName.DATABASE,
                activeTagId: tagId === undefined ? prevState.activeTagId : tagId,
                previousView: undefined
            }));
        });
    },
    showInsights: () => navigate(ViewName.INSIGHTS),
    showSettings: () => navigate(ViewName.SETTINGS),
    showChat: () => navigate(ViewName.CHAT),
    showTaskHistory: () => navigate(ViewName.TASK_HISTORY),
    
    focusOnTask: (taskId: string) => {
        if (taskId === '') {
            setState(prevState => ({ ...prevState, isQuickFocusModalOpen: true }));
            return;
        }
        startTransition(() => {
            setState(prevState => ({
                ...prevState,
                activeTaskId: taskId,
                isFocusExpanded: false, // Start minimized
            }));
        });
    },

    openQuickFocusModal: () => {
        setState(prevState => ({ ...prevState, isQuickFocusModalOpen: true }));
    },
    closeQuickFocusModal: () => {
        setState(prevState => ({ ...prevState, isQuickFocusModalOpen: false }));
    },

    toggleFocusExpansion: () => {
        startTransition(() => {
            setState(prevState => {
                if (!prevState.activeTaskId) return prevState;
                return {
                    ...prevState,
                    isFocusExpanded: !prevState.isFocusExpanded,
                };
            });
        });
    },

    completeFocusSession: (taskId?: string) => {
        startTransition(() => {
            setState(prevState => ({
                ...prevState,
                activeTaskId: undefined,
                isFocusExpanded: false,
                summaryTaskId: taskId,
            }));
        });
    },
    hideSummary: () => {
        setState(prevState => ({ ...prevState, summaryTaskId: undefined }));
    },
    startBreathing: () => {
        startTransition(() => {
            setState(prevState => ({ 
                ...prevState, 
                currentView: ViewName.BREATHING,
                previousView: prevState.currentView
            }));
        });
    },
    startGrounding: () => {
        startTransition(() => {
            setState(prevState => ({ 
                ...prevState, 
                currentView: ViewName.SENSORY_GROUNDING,
                previousView: prevState.currentView
            }));
        });
    },
    quickAddTask: (section = 'inbox') => {
        startTransition(() => {
            setState(prevState => ({
                ...prevState,
                currentView: ViewName.DATABASE,
                autoCreateSection: section,
                activeTagId: null,
            }));
        });
    },
    clearAutoCreate: () => {
        setState(prevState => ({ ...prevState, autoCreateSection: null }));
    },
    selectTag: (tagId: string | null) => {
        startTransition(() => {
            setState(prevState => ({
                ...prevState,
                activeTagId: tagId,
                currentView: ViewName.DATABASE,
                previousView: undefined
            }));
        });
    }
  };

  const value = {
    ...state,
    isNavigating: isPending,
    navigate,
    returnToPreviousView,
    clearFocusSession,
    ...actions,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

/**
 * Hook to consume the navigation state and controls.
 * @throws Error if used outside of `NavigationProvider`.
 */
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
