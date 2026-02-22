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

// Lazy load secondary views
const TaskHistoryView = React.lazy(() => import('@/views/TaskHistoryView'));
const ChatView = React.lazy(() => import('@/views/ChatView'));
const BreathingView = React.lazy(() => import('@/views/BreathingView'));
const SensoryGroundingView = React.lazy(() => import('@/views/SensoryGroundingView'));
const InsightsView = React.lazy(() => import('@/views/InsightsView'));
const SettingsView = React.lazy(() => import('@/views/SettingsView'));

export const AppContent = () => {
  const { currentView, activeTaskId, showDashboard, summaryTaskId, hideSummary, navigate, isQuickFocusModalOpen, closeQuickFocusModal, focusOnTask } = useNavigation();
  const { tasks, loading: tasksLoading } = useTaskContext();
  const { loading: referencesLoading } = useReferenceContext();
  const isLoading = tasksLoading || referencesLoading;

  usePassiveDrain();

  // Find and resume ongoing focus session when app loads
  useEffect(() => {
    if (!tasksLoading && !activeTaskId) {
      const focusedTask = tasks.find(t => t.isFocused);
      if (focusedTask) {
        focusOnTask(focusedTask.id);
      }
    }
  }, [tasks, tasksLoading, activeTaskId, focusOnTask]);

  useEffect(() => {
      // When returning to dashboard, if the previously active task is now complete, clear it.
      if (currentView === ViewName.DASHBOARD && activeTaskId) {
          const task = tasks.find(t => t.id === activeTaskId);
          if (task?.status === 'completed') {
              showDashboard(); // This will reset the activeTaskId in the context
          }
      }
  }, [currentView, activeTaskId, tasks, showDashboard]);

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
  
  const renderView = () => {
    // Standalone views that don't use AppLayout
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
    
    // Views that are children of AppLayout
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
