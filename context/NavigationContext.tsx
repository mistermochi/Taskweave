'use client';

import React, { createContext, useContext, useState, useTransition, PropsWithChildren } from 'react';
import { ViewName, NavigationParams } from '@/types';

interface NavigationState {
  currentView: ViewName;
  previousView?: ViewName;
  activeTaskId?: string;
  activeTagId?: string | null;
  isFocusExpanded: boolean;
  isNavigating: boolean;
  autoCreateSection: string | null;
  summaryTaskId?: string;
  isQuickFocusModalOpen: boolean;
}

interface NavigationActions {
  navigate: (view: ViewName, params?: NavigationParams) => void;
  returnToPreviousView: () => void;
  showDashboard: () => void;
  showDatabase: (tagId?: string | null) => void;
  showInsights: () => void;
  showSettings: () => void;
  showChat: () => void;
  showTaskHistory: () => void;
  focusOnTask: (taskId: string) => void;
  toggleFocusExpansion: () => void;
  completeFocusSession: (taskId?: string) => void;
  clearFocusSession: () => void;
  startBreathing: () => void;
  startGrounding: () => void;
  quickAddTask: (section?: string) => void;
  clearAutoCreate: () => void;
  selectTag: (tagId: string | null) => void;
  hideSummary: () => void;
  openQuickFocusModal: () => void;
  closeQuickFocusModal: () => void;
}

type NavigationContextType = NavigationState & NavigationActions;

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

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

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
