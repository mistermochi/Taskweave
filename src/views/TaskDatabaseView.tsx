'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SlidersHorizontal, Search, Plus } from 'lucide-react';
import { where, orderBy } from 'firebase/firestore';
import { TaskEntity } from '@/entities/task';
import { useTaskDatabaseController } from '@/hooks/controllers/useTaskDatabaseController';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { Toast } from '@/shared/ui/Feedback';
import { Page } from '@/shared/layout/Page';
import { useNavigation } from '@/context/NavigationContext';
import { TaskSection } from '@/entities/task';
import { useTaskContext } from '@/context/TaskContext';
import { Button } from '@/shared/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { CreateTaskSheetContent } from '@/entities/task/ui/task-details/CreateTaskSheetContent';

export const TaskDatabaseView: React.FC = () => {
  const { activeTagId, autoCreateSection, clearAutoCreate, focusOnTask } = useNavigation();
  const { state, actions } = useTaskDatabaseController(activeTagId);
  const { tasks: allTasks } = useTaskContext();
  const [toast, setToast] = useState({ visible: false, message: "", lastCompletedId: null as string | null });
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
      'overdue': true,
      'today': true,
      'upcoming': true,
      'inbox': true,
      'completed': false,
      'archived': false
  });

  const { data: completedTasks } = useFirestoreCollection<TaskEntity>(
    'tasks',
    [where('status', '==', 'completed'), orderBy('completedAt', 'desc')],
    expandedSections.completed
  );

  const { data: archivedTasks } = useFirestoreCollection<TaskEntity>(
    'tasks',
    [where('status', '==', 'archived'), orderBy('archivedAt', 'desc')],
    expandedSections.archived
  );

  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [createInitialSection, setCreateInitialSection] = useState<string | null>(null);

  useEffect(() => {
      if (autoCreateSection) {
          setCreateInitialSection(autoCreateSection);
          setIsCreateSheetOpen(true);
          clearAutoCreate();
      }
  }, [autoCreateSection, clearAutoCreate]);

  const toggleSection = (key: string) => {
      setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const showToast = (message: string, taskId: string | null = null) => {
    setToast({ visible: true, message, lastCompletedId: taskId });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false, lastCompletedId: null }));
    }, 5000);
  };

  const handleComplete = useCallback(async (task: TaskEntity) => {
    const nextDate = await actions.quickCompleteTask(task);
    if (nextDate) {
        const dateStr = new Date(nextDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        showToast(`Task completed. Next due on ${dateStr}`, task.id);
    } else {
        showToast("Task completed", task.id);
    }
  }, [actions]);

  const handleUncomplete = useCallback((task: TaskEntity) => {
    actions.uncompleteTask(task.id);
    showToast("Task reactivated");
  }, [actions]);

  const handleUndo = useCallback(() => {
    if (toast.lastCompletedId) {
      handleUncomplete({ id: toast.lastCompletedId } as TaskEntity);
    }
    setToast({ visible: false, message: "", lastCompletedId: null });
  }, [toast.lastCompletedId, handleUncomplete]);

  const handleUnarchive = useCallback((task: TaskEntity) => {
    actions.unarchiveTask(task.id);
    showToast("Task restored from archive");
  }, [actions]);

  const handleArchive = useCallback((task: TaskEntity) => {
    actions.archiveTask(task.id);
    showToast("Task archived");
  }, [actions]);

  const handleAddToFlow = useCallback((task: TaskEntity) => {
      actions.scheduleForToday(task);
      showToast("Assigned to Today");
  }, [actions]);

  const handleDelete = useCallback((id: string) => {
      actions.deleteTask(id);
  }, [actions]);

  const handleUpdate = useCallback((task: TaskEntity, updates: Partial<TaskEntity>) => {
      actions.updateTask(task.id, updates);
  }, [actions]);

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

  const { sections, tags, recommendation } = state;

  const sectionProps = {
    allTasks: allTasks,
    tags: tags,
    activeTagId: activeTagId,
    onTaskComplete: handleComplete,
    onTaskUncomplete: handleUncomplete,
    onTaskFocus: (task: TaskEntity) => focusOnTask(task.id),
    onTaskDelete: handleDelete,
    onTaskUpdate: handleUpdate,
    onTaskArchive: handleArchive,
    onTaskUnarchive: handleUnarchive,
    recommendation,
  };

  return (
    <Page.Root>
       <Page.Header 
          title={activeTagId ? tags.find(t=>t.id === activeTagId)?.name || 'Inbox' : 'Inbox'} 
          subtitle={activeTagId ? "Project" : undefined}
          actions={
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                        setCreateInitialSection(null);
                        setIsCreateSheetOpen(true);
                    }}
                >
                    <Plus size={16} />
                    New Task
                </Button>
                <button className="p-2 hover:bg-accent rounded-sm text-muted-foreground hover:text-foreground transition-colors">
                    <SlidersHorizontal size={18} />
                </button>
            </div>
          }
       />

       <Page.Content>
            <div className="mb-6 group relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors">
                    <Search size={16} />
                </div>
                <input 
                    className="w-full bg-transparent border-b border-border py-2 pl-7 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 transition-all text-sm font-medium"
                    placeholder="Search by title or notes..."
                    value={state.searchQuery}
                    onChange={(e) => actions.setSearchQuery(e.target.value)}
                />
            </div>
           <TaskSection
              sectionKey="overdue"
              title="Overdue"
              tasks={sections.overdue}
              isExpanded={expandedSections.overdue}
              onToggle={() => toggleSection('overdue')}
              onTaskScheduleToday={handleAddToFlow}
              colorClass="text-destructive"
              {...sectionProps}
            />
           <TaskSection 
              sectionKey="today" 
              title="Planned Today" 
              tasks={sections.today} 
              isExpanded={expandedSections.today}
              onToggle={() => toggleSection('today')}
              {...sectionProps}
            />
           <TaskSection
              sectionKey="upcoming"
              title="Coming 2 Weeks"
              tasks={sections.upcoming}
              isExpanded={expandedSections.upcoming}
              onToggle={() => toggleSection('upcoming')}
              onTaskScheduleToday={handleAddToFlow}
              {...sectionProps}
            />
           <TaskSection
              sectionKey="inbox"
              title="Inbox"
              tasks={sections.inbox}
              isExpanded={expandedSections.inbox}
              onToggle={() => toggleSection('inbox')}
              onTaskScheduleToday={handleAddToFlow}
              {...sectionProps}
            />
           <TaskSection
              sectionKey="completed"
              title="Completed"
              tasks={completedTasks}
              isExpanded={expandedSections.completed}
              onToggle={() => toggleSection('completed')}
              countOverride={expandedSections.completed ? completedTasks.length : undefined}
              {...sectionProps}
            />
           <TaskSection
              sectionKey="archived"
              title="Archived"
              tasks={archivedTasks}
              isExpanded={expandedSections.archived}
              onToggle={() => toggleSection('archived')}
              {...sectionProps}
            />
       </Page.Content>
       
       <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
          <SheetContent className="sm:max-w-md overflow-y-auto">
              <SheetHeader>
                  <SheetTitle>Create New Task</SheetTitle>
              </SheetHeader>
              <CreateTaskSheetContent
                initialSection={createInitialSection}
                activeTagId={activeTagId}
                tags={tags}
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
    </Page.Root>
  );
};

export default TaskDatabaseView;
