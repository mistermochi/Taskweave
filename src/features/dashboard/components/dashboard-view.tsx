"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, Star
} from 'lucide-react';
import { Task, TaskEntity } from '@/entities/task';
import { Tag } from '@/entities/tag';
import { useDashboardController } from '@/hooks/controllers/useDashboardController';
import { ReadinessRing } from './readiness-ring';
import { SmileyScale } from './smiley-scale';
import { QuickActions } from './quick-actions';
import { SectionHeader } from '@/shared/ui/ui/section-header';
import { Card } from '@/shared/ui/ui/card';
import { Button } from '@/shared/ui/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/ui/sheet';
import { useTaskAppStore } from '@/features/task-app/use-task-app';
import { AppHeader } from '@/shared/ui/ui/app-header';
import { TaskNavigation } from '@/features/task-app/components/task-navigation';
import { TaskListItem } from '@/features/task-app/components/task-list-item';
import { createDefaultTask } from '@/features/task-app/lib/constants';

const DashboardTopMetrics = () => {
    const { state, actions } = useDashboardController();
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
  const { selectedTask, setSelectedTask, showToast } = useTaskAppStore();
  const tasks = state.activeTasks as unknown as TaskEntity[];
  const tags = state.tags as unknown as Tag[];

  const tagsMap = React.useMemo(() => {
    return tags.reduce((acc, tag) => {
      acc[tag.id] = tag;
      return acc;
    }, {} as Record<string, Tag>);
  }, [tags]);
  
  const [intention, setIntention] = useState(state.latestFocus);

  useEffect(() => { setIntention(state.latestFocus); }, [state.latestFocus]);

  const handleIntentionBlur = () => {
    if (intention !== state.latestFocus) actions.saveFocus(intention);
  };

  const createNewTask = () => {
    setSelectedTask(createDefaultTask());
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
        <AppHeader
            title="Today"
            subtitle={dateStr}
            nav={<TaskNavigation tags={tags} tasks={tasks} isCollapsed={false} />}
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
                        className="w-full bg-transparent border-b border-border py-2 pl-7 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 transition-all text-sm font-medium"
                        placeholder="What is your main focus?"
                        aria-label="Main focus"
                        value={intention}
                        onChange={(e) => setIntention(e.target.value)}
                        onBlur={handleIntentionBlur}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <DashboardTopMetrics />
                </div>

                <section>
                    <SectionHeader title="Suggested Plan" />
                    {state.suggestedPlan.length > 0 ? (
                       <div className="space-y-2">
                            {state.suggestedPlan.map(task => (
                                <TaskListItem
                                    key={task.id}
                                    task={task as unknown as Task}
                                    tagsMap={tagsMap}
                                    isSelected={selectedTask?.id === task.id}
                                    onClick={setSelectedTask}
                                />
                            ))}
                       </div>
                    ) : (
                        <div className="py-12 text-center text-secondary/40 border-2 border-dashed border-border rounded-xl">
                            <p className="text-sm font-medium">Your flow is empty.</p>
                            <Button
                                variant="link"
                                size="sm"
                                className="mt-1"
                                onClick={createNewTask}
                            >
                                Add a task
                            </Button>
                        </div>
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
