'use client'

import React, { Suspense, useEffect } from 'react';
import { ViewName } from '@/types';
import { AppLayout } from '@/components/AppLayout';
import { usePassiveDrain } from '@/hooks/usePassiveDrain';
import { LoadingScreen } from '@/components/ui/Feedback';
import { useNavigation } from '@/context/NavigationContext';
import { useTaskContext } from '@/context/TaskContext';
import { useReferenceContext } from '@/context/ReferenceContext';
import SessionSummaryModal from '@/components/SessionSummaryModal';
import { QuickFocusModal } from '@/components/QuickFocusModal';
import DashboardView from '@/views/DashboardView';
import TaskDatabaseView from '@/views/TaskDatabaseView';
import { FocusPlayer } from '@/components/FocusPlayer';

// Lazy load secondary views for better initial bundle size
const TaskHistoryView = React.lazy(() => import('@/views/TaskHistoryView'));
const ChatView = React.lazy(() => import('@/views/ChatView'));
const BreathingView = React.lazy(() => import('@/views/BreathingView'));
const SensoryGroundingView = React.lazy(() => import('@/views/SensoryGroundingView'));
const InsightsView = React.lazy(() => import('@/views/InsightsView'));
const SettingsView = React.lazy(() => import('@/views/SettingsView'));

/**
 * The main content switcher and view orchestrator for the application.
 * It determines which top-level view to render based on the global
 * `NavigationContext` and manages background processes like energy drain.
 *
 * @logic
 * - Handles lazy-loading of secondary views with `Suspense`.
 * - Automatically resumes an ongoing focus session if the user refreshes the app.
 * - Triggers the `usePassiveDrain` hook to simulate biological energy loss.
 * - Coordinates global modals (Summary, Quick Focus).
 */
export const AppContent = () => {
  const { currentView, activeTaskId, showDashboard, summaryTaskId, hideSummary, navigate, isQuickFocusModalOpen, closeQuickFocusModal, focusOnTask } = useNavigation();
  const { tasks, loading: tasksLoading } = useTaskContext();
  const { loading: referencesLoading } = useReferenceContext();
  const isLoading = tasksLoading || referencesLoading;

  // Initialize passive energy drain simulation
  usePassiveDrain();

  /**
   * Resumes a focus session if one was active in Firestore but not yet in memory.
   */
  useEffect(() => {
    if (!tasksLoading && !activeTaskId) {
      const focusedTask = tasks.find(t => t.isFocused);
      if (focusedTask) {
        focusOnTask(focusedTask.id);
      }
    }
  }, [tasks, tasksLoading, activeTaskId, focusOnTask]);

  /**
   * Cleans up the active task state if the user navigates away from the dashboard
   * and the previously focused task is now complete.
   */
  useEffect(() => {
      if (currentView === ViewName.DASHBOARD && activeTaskId) {
          const task = tasks.find(t => t.id === activeTaskId);
          if (task?.status === 'completed') {
              showDashboard();
          }
      }
  }, [currentView, activeTaskId, tasks, showDashboard]);

  /**
   * Helper to select the correct view component based on the current state.
   */
  const renderContent = () => {
    if (isLoading) {
      return <LoadingScreen text="Preparing Your Flow..." />;
    }
    switch (currentView) {
        case ViewName.DASHBOARD:
            return <DashboardView />;
        case ViewName.DATABASE:
            return <TaskDatabaseView />;
        case ViewName.TASK_HISTORY:
            return <TaskHistoryView />;
        case ViewName.CHAT:
            return <ChatView />;
        case ViewName.INSIGHTS:
            return <InsightsView onNavigate={navigate} />;
        case ViewName.SETTINGS:
            return <SettingsView />;
        default:
            return <TaskDatabaseView />;
    }
  };
  
  /**
   * High-level view wrapper.
   * Distinguishes between immersive fullscreen views (Breathing)
   * and standard layout views.
   */
  const renderView = () => {
    if ([ViewName.BREATHING, ViewName.SENSORY_GROUNDING].includes(currentView)) {
        switch (currentView) {
            case ViewName.BREATHING:
                return <BreathingView />;
            case ViewName.SENSORY_GROUNDING:
                return <SensoryGroundingView />;
            default:
                return null;
        }
    }
    
    return (
        <AppLayout>
            {renderContent()}
        </AppLayout>
    );
  };

  return (
    <div className="h-full w-full bg-background text-foreground font-sans overflow-hidden flex flex-col">
      <div className="flex-1 min-h-0">
        <Suspense fallback={<LoadingScreen text="Loading View..." />}>
          {renderView()}
        </Suspense>
      </div>

      {activeTaskId && (
          <FocusPlayer />
      )}
      
      <SessionSummaryModal taskId={summaryTaskId} onClose={hideSummary} />
      <QuickFocusModal isOpen={isQuickFocusModalOpen} onClose={closeQuickFocusModal} />
    </div>
  );
};
