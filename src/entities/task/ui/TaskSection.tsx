'use client';

import React from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { Tag } from '@/entities/tag';
import { TaskEntity } from '@/entities/task';
import { TaskRow } from './TaskRow';

/**
 * Interface for TaskSection props.
 */
interface TaskSectionProps {
  /** Logical key for the section (e.g. 'today', 'inbox'). */
  sectionKey: 'overdue' | 'today' | 'upcoming' | 'inbox' | 'completed' | 'archived';
  /** Display title for the section. */
  title: string;
  /** List of tasks to render within this section. */
  tasks: TaskEntity[];
  /** Full list of all active tasks for dependency resolution. */
  allTasks: TaskEntity[];
  /** All available user tags. */
  tags: Tag[];
  /** Whether the section is currently expanded. */
  isExpanded: boolean;
  /** Callback to toggle expansion state. */
  onToggle: () => void;
  /** Key of the section where an inline add form is currently active. */
  addingToSection: string | null;
  /** Callback to initiate inline adding in this section. */
  onStartAdding: () => void;
  /** Callback to cancel inline adding. */
  onCancelAdding: () => void;
  /** Callback to finalize task creation from an inline form. */
  onTaskCreate: (baseTask: TaskEntity, updates: Partial<TaskEntity>) => void;
  /** Callback to complete a task. */
  onTaskComplete: (task: TaskEntity) => void;
  /** Callback to reactivate a completed task. */
  onTaskUncomplete: (task: TaskEntity) => void;
  /** Callback to focus on a task. */
  onTaskFocus: (task: TaskEntity) => void;
  /** Optional callback to move a task into the 'Today' plan. */
  onTaskScheduleToday?: (task: TaskEntity) => void;
  /** Callback to permanently delete a task. */
  onTaskDelete: (id: string) => void;
  /** Callback to update task properties. */
  onTaskUpdate: (task: TaskEntity, updates: Partial<TaskEntity>) => void;
  /** Optional callback to archive a task. */
  onTaskArchive?: (task: TaskEntity) => void;
  /** Callback to restore a task from archive. */
  onTaskUnarchive: (task: TaskEntity) => void;
  /** Current active tag filter ID. */
  activeTagId: string | null;
  /** Optional CSS class for title coloring. */
  colorClass?: string;
  /** Current AI recommendation to highlight. */
  recommendation?: { taskId: string; reason: string } | null;
  /** Optional override for the item count display. */
  countOverride?: number;
}

/**
 * A collapsible container for a group of tasks.
 * It manages the display logic for different task states (Today vs Overdue)
 * and handles the inline creation flow for its assigned section.
 *
 * @component
 */
export const TaskSection: React.FC<TaskSectionProps> = ({
  sectionKey,
  title,
  tasks,
  allTasks,
  tags,
  isExpanded,
  onToggle,
  addingToSection,
  onStartAdding,
  onCancelAdding,
  onTaskCreate,
  onTaskComplete,
  onTaskUncomplete,
  onTaskFocus,
  onTaskScheduleToday,
  onTaskDelete,
  onTaskUpdate,
  onTaskArchive,
  onTaskUnarchive,
  activeTagId,
  colorClass,
  recommendation,
  countOverride,
}) => {
  const isCreatable = ['today', 'upcoming', 'inbox'].includes(sectionKey);
  const displayCount = countOverride ?? tasks.length;
  const isPermanentSection = ['completed', 'archived'].includes(sectionKey);

  // Hide empty sections unless they are 'permanent' (Completed/Archived) or currently being added to.
  if (displayCount === 0 && !isCreatable && !isPermanentSection && addingToSection !== sectionKey) {
    return null;
  }

  /**
   * Generates a template task with sensible defaults for the current section.
   */
  const getGhostTask = (): TaskEntity => {
    let assignedDate: number | undefined = undefined;
    if (sectionKey === 'today') {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      assignedDate = d.getTime();
    } else if (sectionKey === 'upcoming') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(12, 0, 0, 0);
      assignedDate = d.getTime();
    }
    return {
      id: 'new_ghost',
      title: '',
      category: activeTagId || '',
      status: 'active',
      duration: 30,
      energy: 'Medium',
      createdAt: Date.now(),
      assignedDate: assignedDate,
      blockedBy: [],
      isBlocking: [],
    } as TaskEntity;
  };

  return (
    <div className={`mb-4 transition-opacity ${sectionKey === 'completed' || sectionKey === 'archived' ? 'opacity-60 hover:opacity-100' : ''}`}>
      <div
        className="flex items-center gap-2 py-2 group cursor-pointer select-none"
        onClick={onToggle}
      >
        <ChevronRight size={14} className={`text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
        <div className="flex-1 flex justify-between items-center">
            <h2 className={`text-[10px] font-bold uppercase tracking-widest text-muted-foreground ${colorClass}`}>
                {title}
            </h2>
            <span className="text-[10px] text-muted-foreground/40 font-medium">{displayCount}</span>
        </div>
      </div>
      {isExpanded && (
        <div>
          {/* Inline Add Form */}
          {isCreatable && addingToSection === sectionKey ? (
            <div className="animate-in fade-in duration-300 my-1">
              <TaskRow
                task={getGhostTask()}
                allTasks={allTasks}
                tags={tags}
                onComplete={() => {}}
                onFocus={() => {}}
                initialIsEditing={true}
                onDiscard={onCancelAdding}
                onUpdate={onTaskCreate}
              />
            </div>
          ) : isCreatable && tasks.length < 15 ? (
            <button
              onClick={onStartAdding}
              className="flex items-center gap-2 text-[11px] text-muted-foreground hover:text-primary mb-2 py-1 px-2 hover:bg-accent rounded-sm transition-colors group"
            >
              <div className="p-0.5 rounded-sm bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors group-hover:scale-110 transition-transform">
                <Plus size={10} />
              </div>
              <span className="font-bold">
                {sectionKey === 'today' ? 'Plan for Today' : sectionKey === 'upcoming' ? 'Plan for Later' : 'Add to Inbox'}
              </span>
            </button>
          ) : null}

          {/* Task List */}
          <div className={sectionKey === 'overdue' ? 'border-l border-destructive/20' : ''}>
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                allTasks={allTasks}
                tags={tags}
                highlight={recommendation?.taskId === task.id}
                onComplete={sectionKey === 'completed' ? onTaskUncomplete : sectionKey === 'archived' ? onTaskUnarchive : onTaskComplete}
                onFocus={onTaskFocus}
                onScheduleToday={onTaskScheduleToday}
                onDelete={onTaskDelete}
                onUpdate={onTaskUpdate}
                onArchive={sectionKey === 'archived' ? undefined : onTaskArchive}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
