'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wind, MessageSquare, Target, 
  Eye, Plus, Star
} from 'lucide-react';
import { TaskEntity } from '@/types';
import { useDashboardController } from '@/hooks/controllers/useDashboardController';
import { Toast } from '@/components/ui/Feedback';
import { TaskRow } from '@/components/TaskRow';
import { Page } from '@/components/layout/Page';
import { Heading } from '@/components/ui/Typography';
import { useNavigation } from '@/context/NavigationContext';

import { ReadinessRing } from '@/components/dashboard/ReadinessRing';
import { SmileyScale } from '@/components/dashboard/SmileyScale';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';

/**
 * Internal component for rendering the sidebar widgets on the dashboard.
 * Encapsulates the energy readiness, mood scale, and quick action buttons.
 */
const DashboardSidebarContent = () => {
    const { state, actions } = useDashboardController();
    const { focusOnTask, startBreathing, startGrounding, showChat } = useNavigation();

    const [moodLevel, setMoodLevel] = useState(state.latestMood); 
    useEffect(() => { setMoodLevel(state.latestMood); }, [state.latestMood]);

    const handleMoodChange = (newLevel: number) => {
        setMoodLevel(newLevel);
        actions.saveMood(newLevel);
    };

    return (
        <>
            {/* Readiness Widget */}
            <Card className="flex flex-row items-center gap-4 p-4 bg-surface-highlight">
                <ReadinessRing score={state.latestEnergy} />
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary">Readiness</span>
                    <p className="text-foreground text-sm leading-tight">
                        {state.latestEnergy > 70 ? "Peak Condition" : state.latestEnergy > 40 ? "Steady State" : "Recovery Needed"}
                    </p>
                </div>
            </Card>

            {/* Mood Tracker */}
            <div>
                <Heading variant="section">Energy Check-in</Heading>
                <Card className="p-4 bg-foreground/5">
                    <SmileyScale value={moodLevel} onChange={handleMoodChange} />
                </Card>
            </div>

            {/* Quick Actions Grid */}
            <div>
                <Heading variant="section">Quick Actions</Heading>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={startBreathing} className="p-3 bg-foreground/5 hover:bg-foreground/10 rounded-xl border border-border flex flex-col items-center gap-2 transition-colors">
                        <Wind size={20} className="text-blue-300" />
                        <span className="text-xxs font-bold uppercase text-secondary">Breathe</span>
                    </button>
                    <button onClick={startGrounding} className="p-3 bg-foreground/5 hover:bg-foreground/10 rounded-xl border border-border flex flex-col items-center gap-2 transition-colors">
                        <Eye size={20} className="text-emerald-300" />
                        <span className="text-xxs font-bold uppercase text-secondary">Ground</span>
                    </button>
                    <button onClick={showChat} className="p-3 bg-foreground/5 hover:bg-foreground/10 rounded-xl border border-border flex flex-col items-center gap-2 transition-colors">
                        <MessageSquare size={20} className="text-purple-300" />
                        <span className="text-xxs font-bold uppercase text-secondary">Journal</span>
                    </button>
                    <button onClick={() => focusOnTask('')} className="p-3 bg-foreground/5 hover:bg-foreground/10 rounded-xl border border-border flex flex-col items-center gap-2 transition-colors">
                        <Target size={20} className="text-primary" />
                        <span className="text-xxs font-bold uppercase text-secondary">Focus</span>
                    </button>
                </div>
            </div>
        </>
    )
}

/**
 * The primary landing view of the application.
 * Displays the current focus intention, the suggested plan for today,
 * and identifies overdue items. Integrates energy tracking and quick wellbeing tools.
 *
 * @component
 * @interaction
 * - Uses `useDashboardController` to orchestrate task logic and recommendations.
 * - Synchronizes the daily focus intention with Firestore.
 * - Handles task completion, undo, and archival from the main list.
 */
export const DashboardView: React.FC = () => {
  const { state, actions } = useDashboardController();
  const { focusOnTask, quickAddTask } = useNavigation();
  
  const [intention, setIntention] = useState(state.latestFocus);
  const [toast, setToast] = useState({ visible: false, message: "", lastCompletedId: null as string | null });

  // Sync intention state when the database updates
  useEffect(() => { setIntention(state.latestFocus); }, [state.latestFocus]);

  const handleIntentionBlur = () => {
    if (intention !== state.latestFocus) actions.saveFocus(intention);
  };

  const showToast = (message: string, taskId: string | null = null) => {
    setToast({ visible: true, message, lastCompletedId: taskId });
    setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false, lastCompletedId: null }));
    }, 5000);
  };

  /**
   * Completes a task and shows a success toast with the next recurrence date if applicable.
   */
  const handleComplete = async (task: TaskEntity) => {
      const nextDate = await actions.completeTask(task);
      if (nextDate) {
          const dateStr = new Date(nextDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          showToast(`Task completed. Next due on ${dateStr}`, task.id);
      } else {
          showToast("Task completed", task.id);
      }
  };

  /**
   * Reverts the status of the most recently completed task.
   */
  const handleUndo = () => {
    if (toast.lastCompletedId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      actions.updateTask(toast.lastCompletedId, { status: 'active', completedAt: null as any });
      setToast({ visible: false, message: "", lastCompletedId: null });
      showToast("Task restored");
    }
  };

  const handleArchive = (task: TaskEntity) => {
      actions.updateTask(task.id, { 
          status: 'archived', 
          archivedAt: Date.now(), 
          isFocused: false 
      });
      showToast("Task archived");
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
        
        {/* === LEFT COLUMN / MAIN CONTENT === */}
        <Page.Root className="flex-1 md:border-r md:border-border">
            <Page.Header 
                title="Focus for today" 
                subtitle={dateStr}
            />

            <Page.Content>
                <div className="max-w-3xl mx-auto">
                    
                    {/* Intention Input */}
                    <div className="mb-8 group relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 text-secondary/30 group-focus-within:text-primary transition-colors">
                            <Star size={16} fill="currentColor" />
                        </div>
                        <input 
                            className="w-full bg-transparent border-b border-border py-2 pl-7 text-foreground placeholder:text-secondary/30 focus:outline-none focus:border-primary/50 transition-all text-sm font-medium"
                            placeholder="What is your main focus?"
                            value={intention}
                            onChange={(e) => setIntention(e.target.value)}
                            onBlur={handleIntentionBlur}
                        />
                    </div>

                    {/* Suggested Plan */}
                    <Page.Section>
                        <SectionHeader title="Suggested Plan" />
                        {state.suggestedPlan.length > 0 ? (
                           state.suggestedPlan.map(task => (
                                <TaskRow 
                                    key={task.id} 
                                    task={task}
                                    highlight={state.recommendation?.taskId === task.id}
                                    allTasks={state.activeTasks}
                                    tags={state.tags} 
                                    onComplete={handleComplete} 
                                    onFocus={(task) => focusOnTask(task.id)}
                                    onUpdate={(t, u) => actions.updateTask(t.id, u)}
                                    onArchive={handleArchive}
                                />
                            ))
                        ) : (
                            <div className="py-12 text-center text-secondary/40 border-2 border-dashed border-border rounded-xl">
                                <p className="text-sm">Your flow is empty.</p>
                                <button onClick={() => quickAddTask()} className="mt-2 text-primary text-xs font-bold hover:underline">Add a task</button>
                            </div>
                        )}
                    </Page.Section>


                    {/* Past Due Section */}
                    {state.overdueTasks.length > 0 && (
                        <Page.Section>
                            <SectionHeader 
                                title="Past Due" 
                                action={<span className="bg-red-500/20 text-red-400 px-1.5 rounded text-xxs">{state.overdueTasks.length}</span>}
                                className="text-red-400"
                            />
                            <div className="border-l-2 border-red-500/20 pl-2">
                                {state.overdueTasks.map(task => (
                                    <TaskRow 
                                        key={task.id} 
                                        task={task} 
                                        allTasks={state.activeTasks}
                                        tags={state.tags} 
                                        onComplete={handleComplete} 
                                        onFocus={(task) => focusOnTask(task.id)}
                                        onUpdate={(t, u) => actions.updateTask(t.id, u)}
                                        onArchive={handleArchive}
                                    />
                                ))}
                            </div>
                        </Page.Section>
                    )}

                    {/* Quick Add Placeholder */}
                    <button 
                        onClick={() => quickAddTask()}
                        className="w-full py-3 rounded-lg border border-border hover:bg-foreground/5 text-secondary hover:text-foreground transition-all flex items-center gap-2 px-3 group"
                    >
                        <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus size={14} />
                        </div>
                        <span className="text-sm font-medium">Add task to Flow</span>
                    </button>

                    {/* Mobile-only sidebar content */}
                    <div className="md:hidden mt-12 pt-8 border-t border-border flex flex-col gap-6">
                        <DashboardSidebarContent />
                    </div>
                </div>
            </Page.Content>
        </Page.Root>

        {/* === RIGHT COLUMN: Context Sidebar (Desktop) === */}
        <aside className="hidden md:flex w-80 bg-surface flex-col p-6 gap-6 overflow-y-auto no-scrollbar">
            <DashboardSidebarContent />
        </aside>

        <Toast 
          message={toast.message} 
          isVisible={toast.visible} 
          onUndo={toast.lastCompletedId ? handleUndo : undefined}
        />
    </div>
  );
};

export default DashboardView;
