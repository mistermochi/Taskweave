'use client';

import React from 'react';
import { Tag } from '@/entities/tag';
import { TaskEntity } from '@/entities/task';
import { TaskRow } from './TaskRow';
import { Badge } from '@/shared/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/shared/ui/accordion';
import { cn } from '@/shared/lib/utils';

interface TaskSectionProps {
  sectionKey: 'overdue' | 'today' | 'upcoming' | 'inbox' | 'completed' | 'archived';
  title: string;
  tasks: TaskEntity[];
  allTasks: TaskEntity[];
  tags: Tag[];
  isExpanded: boolean;
  onToggle: () => void;
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
  onTaskComplete,
  onTaskUncomplete,
  onTaskFocus,
  onTaskScheduleToday,
  onTaskDelete,
  onTaskUpdate,
  onTaskArchive,
  onTaskUnarchive,
  colorClass,
  recommendation,
  countOverride,
}) => {
  const displayCount = countOverride ?? tasks.length;
  const isPermanentSection = ['completed', 'archived'].includes(sectionKey);

  if (displayCount === 0 && !isPermanentSection) {
    return null;
  }

  return (
    <Accordion
      type="single"
      collapsible
      value={isExpanded ? sectionKey : ""}
      onValueChange={(val) => onToggle()}
      className="mb-2"
    >
      <AccordionItem value={sectionKey} className="border-none">
        <AccordionTrigger className={cn(
          "hover:no-underline py-2 px-3 hover:bg-muted/30 rounded-sm transition-colors",
          (sectionKey === 'completed' || sectionKey === 'archived') && "opacity-60"
        )}>
          <div className="flex-1 flex justify-between items-center pr-4">
            <h2 className={cn("text-xs font-semibold tracking-tight", colorClass)}>
              {title}
            </h2>
            <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 py-0 font-medium tabular-nums">
              {displayCount}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-1 pb-2">
          <div className={cn(
            "space-y-px",
            sectionKey === 'overdue' && "border-l-2 border-destructive/20 ml-1"
          )}>
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
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
