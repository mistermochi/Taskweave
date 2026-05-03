"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Star, X, Sparkles
} from 'lucide-react';
import { vibrate } from '@/shared/lib/utils';
import { Task, TaskEntity } from '@/entities/task';
import { Tag } from '@/entities/tag';
import { useDashboardController } from '@/hooks/controllers/useDashboardController';
import { ReadinessRing } from './readiness-ring';
import { SmileyScale } from './smiley-scale';
import { QuickActions } from './quick-actions';
import { SectionHeader } from '@/shared/ui/ui/section-header';
import { Card } from '@/shared/ui/ui/card';
import { Button } from '@/shared/ui/ui/button';
import { EmptyState } from '@/shared/ui/ui/empty-state';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/ui/sheet';
import { useTaskAppStore } from '@/features/task-app/use-task-app';
import { useReferenceContext } from '@/context/ReferenceContext';
import { AppHeader } from '@/shared/ui/ui/app-header';
import { TaskNavigation } from '@/features/task-app/components/task-navigation';
import { TaskListItem } from '@/features/task-app/components/task-list-item';
import { createDefaultTask } from '@/features/task-app/lib/constants';

/**
 * Bolt ⚡ Optimization: Accepts state and actions as props to avoid redundant
 * useDashboardController() execution (and its internal AI recommendation effect).
 */
interface DashboardTopMetricsProps {
  state: ReturnType<typeof useDashboardController>['state'];
  actions: ReturnType<typeof useDashboardController>['actions'];
}

const DashboardTopMetrics = ({ state, actions }: DashboardTopMetricsProps) => {
    const [moodLevel, setMoodLevel] = useState(state.latestMood); 

    useEffect(() => { setMoodLevel(state.latestMood); }, [state.latestMood]);

    const handleMoodChange = (newLevel: number) => {
        setMoodLevel(newLevel);
        actions.saveMood(newLevel);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
            <Card className="flex flex-row items-center gap-4 p-4 shadow-none rounded-lg border-border bg-card">
                <ReadinessRing score={state.latestEnergy} />
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Readiness</span>
                    <p className="text-foreground text-sm leading-tight font-medium">
                        {state.latestEnergy > 70 ? "Peak Condition" : state.latestEnergy > 40 ? "Steady State" : "Recovery Needed"}
                    </p>
                </div>
            </Card>

            <div>
                <SectionHeader title="Energy Check-in" className="mb-3" />
                <Card className="p-4 shadow-none rounded-lg border-border bg-card">
                    <SmileyScale value={moodLevel} onChange={handleMoodChange} />
                </Card>
            </div>
            </div>

            <div className="space-y-6">
            <div>
                <SectionHeader title="Quick Actions" className="mb-3" />
                <QuickActions />
            </div>
            </div>
        </div>
    )
}

export const DashboardView: React.FC = () => {
  const { state, actions } = useDashboardController();

  /**
   * Bolt ⚡ Optimization: Use fine-grained Zustand selectors to prevent
   * re-renders when unrelated store fields change.
   */
  const selectedTask = useTaskAppStore((s) => s.selectedTask);
  const setSelectedTask = useTaskAppStore((s) => s.setSelectedTask);

  /**
   * Bolt ⚡ Optimization: Reuse the global tagsMap from ReferenceContext
   * to avoid O(T) recalculation on every render.
   */
  const { tagsMap } = useReferenceContext();
  const tasks = state.activeTasks as unknown as TaskEntity[];
  
  const [intention, setIntention] = useState(state.latestFocus);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIntention(state.latestFocus);
  }, [state.latestFocus]);

  const handleIntentionBlur = () => {
    if (intention !== state.latestFocus) {
        actions.saveFocus(intention);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
        setIntention('');
        vibrate('light');
    }
  };

  const handleClearIntention = (e: React.MouseEvent) => {
    // Use preventDefault on mousedown to prevent the input from blurring,
    // which would trigger an early save with the old value.
    e.preventDefault();
    setIntention('');
    vibrate('light');
  };

  const createNewTask = () => {
    vibrate('light');
    setSelectedTask(createDefaultTask());
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
        <AppHeader
            title="Today"
            subtitle={dateStr}
            nav={<TaskNavigation tags={state.tags as unknown as Tag[]} tasks={tasks} isCollapsed={false} />}
            actions={
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                        onClick={createNewTask}
                >
                    <Plus size={16} />
                    New Task
                </Button>
            }
        />
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-24 relative">
            <div className="pb-8 pt-4 space-y-8">

                <div className="group relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors">
                        <Star size={16} fill="currentColor" />
                    </div>
                    <input
                        ref={inputRef}
                        className="w-full bg-transparent border-b border-border py-2 pl-7 pr-8 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 transition-all text-sm font-medium"
                        placeholder="What is your main focus?"
                        aria-label="Main focus"
                        value={intention}
                        onChange={(e) => setIntention(e.target.value)}
                        onBlur={handleIntentionBlur}
                        onKeyDown={handleKeyDown}
                    />
                    {intention && (
                        <button
                            type="button"
                            onMouseDown={handleClearIntention}
                            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
                            aria-label="Clear focus"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <DashboardTopMetrics state={state} actions={actions} />
                </div>

                <section>
                    <SectionHeader title="Suggested Plan" />
                    {state.suggestedPlan.length > 0 ? (
                       <div className="space-y-2">
                            {state.suggestedPlan.map(task => (
                                <TaskListItem
                                    key={task.id}
                                    task={task as unknown as Task}
                                    categoryTag={tagsMap[task.category]}
                                    isSelected={selectedTask?.id === task.id}
                                    onClick={setSelectedTask}
                                />
                            ))}
                       </div>
                    ) : (
                        <EmptyState
                            icon={Sparkles}
                            title="Your flow is empty."
                            message="We'll suggest tasks here based on your energy and priorities."
                            action={
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={createNewTask}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add a task
                                </Button>
                            }
                            className="border-2 border-dashed border-border rounded-xl"
                        />
                    )}
                </section>

                <Button
                    variant="outline"
                    className="w-full py-6 border-dashed border-2 hover:bg-accent/50 text-muted-foreground flex items-center justify-start gap-3 px-4 group rounded-xl"
                    onClick={createNewTask}
                >
                    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus size={14} />
                    </div>
                    <span className="text-sm font-medium">Add task</span>
                </Button>
            </div>
        </div>

    </div>
  );
};
