
'use client';

import React from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { TaskEntity, Tag } from '@/types';
import { TaskRow } from '@/components/TaskRow';

interface TaskSectionProps {
  sectionKey: 'overdue' | 'today' | 'upcoming' | 'inbox' | 'completed' | 'archived';
  title: string;
  tasks: TaskEntity[];
  allTasks: TaskEntity[]; // All tasks for dependency picker
  tags: Tag[];
  isExpanded: boolean;
  onToggle: () => void;
  addingToSection: string | null;
  onStartAdding: () => void;
  onCancelAdding: () => void;
  onTaskCreate: (baseTask: TaskEntity, updates: Partial<TaskEntity>) => void;
  onTaskComplete: (task: TaskEntity) => void;
  onTaskUncomplete: (task: TaskEntity) => void;
  onTaskFocus: (task: TaskEntity) => void;
  onTaskScheduleToday?: (task: TaskEntity) => void;
  onTaskDelete: (id: string) => void;
  onTaskUpdate: (task: TaskEntity, updates: Partial<TaskEntity>) => void;
  onTaskArchive?: (task: TaskEntity) => void;
  onTaskUnarchive: (task: TaskEntity) => void;
  activeTagId: string | null;
  colorClass?: string;
  recommendation?: { taskId: string; reason: string } | null;
  countOverride?: number;
}

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

  // Hide section ONLY if it's not permanent, has no items, and isn't being added to.
  if (displayCount === 0 && !isCreatable && !isPermanentSection && addingToSection !== sectionKey) {
    return null;
  }

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
        <ChevronRight size={14} className={`text-secondary transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
        <div className="flex-1 flex justify-between items-center">
            <h2 className={`text-xs font-bold uppercase tracking-widest text-secondary ${colorClass}`}>
                {title}
            </h2>
            <span className="text-xs text-secondary/40 font-medium">{displayCount}</span>
        </div>
      </div>
      {isExpanded && (
        <div>
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
          ) : isCreatable && tasks.length < 15 ? ( // Limit add button if list is too long
            <button
              onClick={onStartAdding}
              className="flex items-center gap-2 text-xs text-secondary hover:text-primary mb-2 py-1 px-2 hover:bg-foreground/5 rounded transition-colors group"
            >
              <div className="p-0.5 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors group-hover:scale-110 transition-transform">
                <Plus size={10} />
              </div>
              <span className="font-bold">
                {sectionKey === 'today' ? 'Plan for Today' : sectionKey === 'upcoming' ? 'Plan for Later' : 'Add to Inbox'}
              </span>
            </button>
          ) : null}

          <div className={sectionKey === 'overdue' ? 'border-l border-red-500/20' : ''}>
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
