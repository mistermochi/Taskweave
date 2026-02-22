

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SlidersHorizontal, Search } from 'lucide-react';
import { where, orderBy } from 'firebase/firestore';
import { TaskEntity } from '@/types';
import { useTaskDatabaseController } from '@/hooks/controllers/useTaskDatabaseController';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { Toast } from '@/components/ui/Feedback';
import { Page } from '@/components/layout/Page';
import { useNavigation } from '@/context/NavigationContext';
import { TaskSection } from '@/components/TaskSection';
import { useTaskContext } from '@/context/TaskContext';

interface TaskDatabaseViewProps {}

export const TaskDatabaseView: React.FC<TaskDatabaseViewProps> = () => {
  const { activeTagId, autoCreateSection, clearAutoCreate, focusOnTask } = useNavigation();
  const { state, actions } = useTaskDatabaseController(activeTagId);
  const { tasks: allTasks } = useTaskContext();
  const [toast, setToast] = useState({ visible: false, message: "", lastCompletedId: null as string | null });
  
  // Section Expansion State
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
      'overdue': true,
      'today': true,
      'upcoming': true,
      'inbox': true,
      'completed': false,
      'archived': false
  });

  // --- LAZY LOADING FOR HISTORICAL DATA ---
  const { data: completedTasks } = useFirestoreCollection<TaskEntity>(
    'tasks',
    [where('status', '==', 'completed'), orderBy('completedAt', 'desc')],
    expandedSections.completed // This query is only enabled when the section is expanded
  );
  const { data: archivedTasks } = useFirestoreCollection<TaskEntity>(
    'tasks',
    [where('status', '==', 'archived'), orderBy('archivedAt', 'desc')],
    expandedSections.archived // This query is only enabled when the section is expanded
  );

  // Adding State
  const [addingToSection, setAddingToSection] = useState<string | null>(null);

  // Handle external create request
  useEffect(() => {
      if (autoCreateSection) {
          setAddingToSection(autoCreateSection);
          setExpandedSections(prev => ({ ...prev, [autoCreateSection]: true }));
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

  // --- Memoized Callbacks for TaskRow/TaskSection ---
  
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

  const handleCreateFromRow = async (baseTask: TaskEntity, updates: Partial<TaskEntity>) => {
      const merged = { ...baseTask, ...updates };
      const nextDate = await actions.createTask(merged.title, {
          category: merged.category,
          duration: merged.duration,
          energy: merged.energy, 
          dueDate: merged.dueDate,
          assignedDate: merged.assignedDate,
          recurrence: merged.recurrence,
          notes: merged.notes
      });
      
      if (nextDate) {
          const dateStr = new Date(nextDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          showToast(`Task created. Next due on ${dateStr}`);
      } else {
          showToast("Task created");
      }
      setAddingToSection(null);
  };

  const handleReject = useCallback(() => {
      actions.rejectRecommendation();
      showToast("Suggestion dismissed. We'll learn from this.");
  }, [actions]);

  const { sections, tags, recommendation } = state;
  const sectionProps = {
    allTasks: allTasks,
    tags: tags,
    activeTagId: activeTagId,
    addingToSection: addingToSection,
    onCancelAdding: () => setAddingToSection(null),
    onTaskCreate: handleCreateFromRow,
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
            <button className="p-2 hover:bg-foreground/5 rounded text-secondary hover:text-foreground transition-colors">
               <SlidersHorizontal size={18} />
            </button>
          }
       />

       <Page.Content>
            <div className="mb-4 group relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 text-secondary/30 group-focus-within:text-primary transition-colors">
                    <Search size={16} />
                </div>
                <input 
                    className="w-full bg-transparent border-b border-border py-2 pl-7 text-foreground placeholder:text-secondary/30 focus:outline-none focus:border-primary/50 transition-all text-sm font-medium"
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
              onStartAdding={() => {}} 
              onTaskScheduleToday={handleAddToFlow}
              colorClass="text-red-400"
              {...sectionProps}
            />
           <TaskSection 
              sectionKey="today" 
              title="Planned Today" 
              tasks={sections.today} 
              isExpanded={expandedSections.today}
              onToggle={() => toggleSection('today')}
              onStartAdding={() => setAddingToSection('today')}
              onTaskScheduleToday={undefined}
              {...sectionProps}
            />
           <TaskSection
              sectionKey="upcoming"
              title="Coming 2 Weeks"
              tasks={sections.upcoming}
              isExpanded={expandedSections.upcoming}
              onToggle={() => toggleSection('upcoming')}
              onStartAdding={() => setAddingToSection('upcoming')}
              onTaskScheduleToday={handleAddToFlow}
              {...sectionProps}
            />
           <TaskSection
              sectionKey="inbox"
              title="Inbox"
              tasks={sections.inbox}
              isExpanded={expandedSections.inbox}
              onToggle={() => toggleSection('inbox')}
              onStartAdding={() => setAddingToSection('inbox')}
              onTaskScheduleToday={handleAddToFlow}
              {...sectionProps}
            />
           <TaskSection
              sectionKey="completed"
              title="Completed"
              tasks={completedTasks}
              isExpanded={expandedSections.completed}
              onToggle={() => toggleSection('completed')}
              onStartAdding={() => {}}
              onTaskScheduleToday={undefined}
              countOverride={expandedSections.completed ? completedTasks.length : undefined}
              {...sectionProps}
            />
           <TaskSection
              sectionKey="archived"
              title="Archived"
              tasks={archivedTasks}
              isExpanded={expandedSections.archived}
              onToggle={() => toggleSection('archived')}
              onStartAdding={() => {}}
              onTaskScheduleToday={undefined}
              {...sectionProps}
            />
       </Page.Content>
       
       <Toast 
          message={toast.message} 
          isVisible={toast.visible} 
          onUndo={toast.lastCompletedId ? handleUndo : undefined}
       />
    </Page.Root>
  );
};

export default TaskDatabaseView;
