"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, Star
} from 'lucide-react';
import { Task, TaskEntity } from '@/entities/task';
import { Tag } from '@/entities/tag';
import { useDashboardController } from '@/hooks/controllers/useDashboardController';
import { TaskRow } from '@/entities/task';
import { Page } from '@/shared/layout/Page';
import { Heading } from '@/shared/ui/ui/Typography';
import { ReadinessRing } from './readiness-ring';
import { SmileyScale } from './smiley-scale';
import { QuickActions } from './quick-actions';
import { SectionHeader } from '@/shared/ui/ui/SectionHeader';
import { Card } from '@/shared/ui/ui/card';
import { Button } from '@/shared/ui/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/ui/sheet';
import { CreateTaskSheetContent } from '@/entities/task/ui/task-details/CreateTaskSheetContent';
import { useTaskAppStore } from '@/features/task-app/use-task-app';

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
                <Heading variant="section" className="text-muted-foreground mb-3 font-semibold">Energy Check-in</Heading>
                <Card className="p-4 shadow-none rounded-lg border-border bg-card">
                    <SmileyScale value={moodLevel} onChange={handleMoodChange} />
                </Card>
            </div>
            </div>

            <div className="space-y-6">
            <div>
                <Heading variant="section" className="text-muted-foreground mb-3 font-semibold">Quick Actions</Heading>
                <QuickActions />
            </div>
            </div>
        </div>
    )
}

export const DashboardView: React.FC = () => {
  const { state, actions } = useDashboardController();
  const { setSelectedTask, showToast } = useTaskAppStore();
  
  const [intention, setIntention] = useState(state.latestFocus);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

  useEffect(() => { setIntention(state.latestFocus); }, [state.latestFocus]);

  const handleIntentionBlur = () => {
    if (intention !== state.latestFocus) actions.saveFocus(intention);
  };

  const handleComplete = async (task: TaskEntity) => {
      const nextDate = await actions.completeTask(task);
      if (nextDate) {
          const dateStr = new Date(nextDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          showToast(`Task completed. Next due on ${dateStr}`, () => {
              actions.updateTask(task.id, { status: 'active', completedAt: null as unknown as number });
          });
      } else {
          showToast("Task completed", () => {
              actions.updateTask(task.id, { status: 'active', completedAt: null as unknown as number });
          });
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

  const handleCreateTask = async (title: string, updates: Partial<Task>) => {
      const nextDate = await actions.createTask(title, updates);
      if (nextDate) {
          const dateStr = new Date(nextDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          showToast(`Task created. Next due on ${dateStr}`);
      } else {
          showToast("Task created");
      }
      setIsCreateSheetOpen(false);
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
        <Page.Root className="flex-1">
            <Page.Header 
                title="Today"
                subtitle={dateStr}
                actions={
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setIsCreateSheetOpen(true)}
                    >
                        <Plus size={16} />
                        New Task
                    </Button>
                }
            />

            <Page.Content className="pb-8">
                <div className="max-w-2xl mx-auto py-2 space-y-8">
                    
                    <div className="group relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors">
                            <Star size={16} fill="currentColor" />
                        </div>
                        <input 
                            className="w-full bg-transparent border-b border-border py-2 pl-7 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 transition-all text-sm font-medium"
                            placeholder="What is your main focus?"
                            value={intention}
                            onChange={(e) => setIntention(e.target.value)}
                            onBlur={handleIntentionBlur}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <DashboardTopMetrics />
                    </div>

                    <Page.Section>
                        <SectionHeader title="Suggested Plan" />
                        {state.suggestedPlan.length > 0 ? (
                           <div className="space-y-1">
                                {state.suggestedPlan.map(task => (
                                    <TaskRow
                                        key={task.id}
                                        task={task as unknown as TaskEntity}
                                        highlight={state.recommendation?.taskId === task.id}
                                        allTasks={state.activeTasks as unknown as TaskEntity[]}
                                        tags={state.tags as unknown as Tag[]}
                                        onComplete={handleComplete}
                                        onFocus={(task) => setSelectedTask(task as unknown as Task)}
                                        onUpdate={(t, u) => actions.updateTask(t.id, u)}
                                        onArchive={handleArchive}
                                        onScheduleToday={(t) => actions.updateTask(t.id, { assignedDate: Date.now() })}
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
                                    onClick={() => setIsCreateSheetOpen(true)}
                                >
                                    Add a task
                                </Button>
                            </div>
                        )}
                    </Page.Section>


                    {state.overdueTasks.length > 0 && (
                        <Page.Section>
                            <SectionHeader 
                                title="Past Due" 
                                action={<span className="bg-destructive/10 text-destructive px-2 py-0.5 rounded-full text-[10px] font-bold">{state.overdueTasks.length}</span>}
                                className="text-destructive"
                            />
                            <div className="border-l-2 border-destructive/20 pl-2 space-y-1">
                                {state.overdueTasks.map(task => (
                                    <TaskRow 
                                        key={task.id} 
                                        task={task as unknown as TaskEntity}
                                        allTasks={state.activeTasks as unknown as TaskEntity[]}
                                        tags={state.tags as unknown as Tag[]}
                                        onComplete={handleComplete} 
                                        onFocus={(task) => setSelectedTask(task as unknown as Task)}
                                        onUpdate={(t, u) => actions.updateTask(t.id, u)}
                                        onArchive={handleArchive}
                                        onScheduleToday={(t) => actions.updateTask(t.id, { assignedDate: Date.now() })}
                                    />
                                ))}
                            </div>
                        </Page.Section>
                    )}

                    <Button
                        variant="outline"
                        className="w-full py-6 border-dashed border-2 hover:bg-accent/50 text-muted-foreground flex items-center justify-start gap-3 px-4 group rounded-xl"
                        onClick={() => setIsCreateSheetOpen(true)}
                    >
                        <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus size={14} />
                        </div>
                        <span className="text-sm font-medium">Add task</span>
                    </Button>
                </div>
            </Page.Content>
        </Page.Root>

        <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
            <SheetContent className="sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Create New Task</SheetTitle>
                </SheetHeader>
                <CreateTaskSheetContent
                    initialSection="today"
                    activeTagId={null}
                    tags={state.tags as unknown as Tag[]}
                    onCreate={handleCreateTask}
                    onClose={() => setIsCreateSheetOpen(false)}
                />
            </SheetContent>
        </Sheet>
    </div>
  );
};
