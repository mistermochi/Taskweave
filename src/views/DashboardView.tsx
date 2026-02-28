'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wind, MessageSquare, Target, 
  Eye, Plus, Star
} from 'lucide-react';
import { TaskEntity } from '@/entities/task';
import { useDashboardController } from '@/hooks/controllers/useDashboardController';
import { Toast } from '@/shared/ui/Feedback';
import { TaskRow } from '@/entities/task';
import { Page } from '@/shared/layout/Page';
import { Heading } from '@/shared/ui/Typography';
import { useNavigation } from '@/context/NavigationContext';

import { ReadinessRing } from '@/components/dashboard/ReadinessRing';
import { SmileyScale } from '@/components/dashboard/SmileyScale';
import { SectionHeader } from '@/shared/ui/SectionHeader';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { CreateTaskSheetContent } from '@/entities/task/ui/task-details/CreateTaskSheetContent';

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
            <Card className="flex flex-row items-center gap-4 p-4 shadow-none rounded-sm border-border bg-card">
                <ReadinessRing score={state.latestEnergy} />
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Readiness</span>
                    <p className="text-foreground text-sm leading-tight font-medium">
                        {state.latestEnergy > 70 ? "Peak Condition" : state.latestEnergy > 40 ? "Steady State" : "Recovery Needed"}
                    </p>
                </div>
            </Card>

            <div>
                <Heading variant="section" className="text-muted-foreground">Energy Check-in</Heading>
                <Card className="p-4 shadow-none rounded-sm border-border bg-card">
                    <SmileyScale value={moodLevel} onChange={handleMoodChange} />
                </Card>
            </div>

            <div>
                <Heading variant="section" className="text-muted-foreground">Quick Actions</Heading>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={startBreathing} className="p-3 bg-muted/50 hover:bg-accent hover:text-accent-foreground rounded-sm border border-border flex flex-col items-center gap-2 transition-colors">
                        <Wind size={20} className="text-primary" />
                        <span className="text-[10px] font-bold uppercase text-muted-foreground group-hover:text-inherit">Breathe</span>
                    </button>
                    <button onClick={startGrounding} className="p-3 bg-muted/50 hover:bg-accent hover:text-accent-foreground rounded-sm border border-border flex flex-col items-center gap-2 transition-colors">
                        <Eye size={20} className="text-primary" />
                        <span className="text-[10px] font-bold uppercase text-muted-foreground group-hover:text-inherit">Ground</span>
                    </button>
                    <button onClick={showChat} className="p-3 bg-muted/50 hover:bg-accent hover:text-accent-foreground rounded-sm border border-border flex flex-col items-center gap-2 transition-colors">
                        <MessageSquare size={20} className="text-primary" />
                        <span className="text-[10px] font-bold uppercase text-muted-foreground group-hover:text-inherit">Journal</span>
                    </button>
                    <button onClick={() => focusOnTask('')} className="p-3 bg-muted/50 hover:bg-accent hover:text-accent-foreground rounded-sm border border-border flex flex-col items-center gap-2 transition-colors">
                        <Target size={20} className="text-primary" />
                        <span className="text-[10px] font-bold uppercase text-muted-foreground group-hover:text-inherit">Focus</span>
                    </button>
                </div>
            </div>
        </>
    )
}

export const DashboardView: React.FC = () => {
  const { state, actions } = useDashboardController();
  const { focusOnTask, quickAddTask } = useNavigation();
  
  const [intention, setIntention] = useState(state.latestFocus);
  const [toast, setToast] = useState({ visible: false, message: "", lastCompletedId: null as string | null });
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

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

  const handleComplete = async (task: TaskEntity) => {
      const nextDate = await actions.completeTask(task);
      if (nextDate) {
          const dateStr = new Date(nextDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          showToast(`Task completed. Next due on ${dateStr}`, task.id);
      } else {
          showToast("Task completed", task.id);
      }
  };

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

  const handleCreateTask = async (title: string, updates: Partial<TaskEntity>) => {
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
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
        
        <Page.Root className="flex-1 md:border-r md:border-border">
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

            <Page.Content>
                <div className="max-w-3xl mx-auto">
                    
                    <div className="mb-8 group relative">
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

                    <Page.Section>
                        <SectionHeader title="Suggested Plan" />
                        {state.suggestedPlan.length > 0 ? (
                           <div className="space-y-px">
                                {state.suggestedPlan.map(task => (
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
                            <div className="border-l-2 border-destructive/20 pl-2 space-y-px">
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
                                        onScheduleToday={(t) => actions.updateTask(t.id, { assignedDate: Date.now() })}
                                    />
                                ))}
                            </div>
                        </Page.Section>
                    )}

                    <Button
                        variant="outline"
                        className="w-full py-6 mt-4 border-dashed border-2 hover:bg-accent/50 text-muted-foreground flex items-center justify-start gap-3 px-4 group"
                        onClick={() => setIsCreateSheetOpen(true)}
                    >
                        <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus size={14} />
                        </div>
                        <span className="text-sm font-medium">Add task</span>
                    </Button>

                    <div className="md:hidden mt-12 pt-8 border-t border-border flex flex-col gap-6">
                        <DashboardSidebarContent />
                    </div>
                </div>
            </Page.Content>
        </Page.Root>

        <aside className="hidden md:flex w-80 bg-muted/30 border-l border-border flex-col p-6 gap-6 overflow-y-auto no-scrollbar">
            <DashboardSidebarContent />
        </aside>

        <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
            <SheetContent className="sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Create New Task</SheetTitle>
                </SheetHeader>
                <CreateTaskSheetContent
                    initialSection="today"
                    activeTagId={null}
                    tags={state.tags}
                    onCreate={handleCreateTask}
                    onClose={() => setIsCreateSheetOpen(false)}
                />
            </SheetContent>
        </Sheet>

        <Toast 
          message={toast.message} 
          isVisible={toast.visible} 
          onUndo={toast.lastCompletedId ? handleUndo : undefined}
        />
    </div>
  );
};

export default DashboardView;
