'use client';

import React, { useState, useEffect, memo, useMemo } from 'react';
import {
    Play,
    Sun,
    Archive,
    Trash2,
    Edit2,
    MoreHorizontal,
    Hash,
    CalendarClock,
    Calendar,
    Clock,
    Zap,
    GitBranch,
    Repeat
} from 'lucide-react';
import { Tag } from '@/entities/tag';
import { TaskEntity } from '@/entities/task';
import { useTaskDisplayInfo, useTaskTimer } from '@/entities/task';
import { Checkbox } from '@/shared/ui/checkbox';
import { Badge } from '@/shared/ui/badge';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger
} from '@/shared/ui/context-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle
} from '@/shared/ui/sheet';
import { TaskDetailsSheetContent } from './task-details/TaskDetailsSheetContent';
import { cn } from '@/shared/lib/utils';

interface TaskRowProps {
    task: TaskEntity;
    allTasks: TaskEntity[];
    tags: Tag[];
    onComplete: (task: TaskEntity) => void;
    onFocus: (task: TaskEntity) => void;
    onScheduleToday?: (task: TaskEntity) => void;
    onDelete?: (id: string) => void;
    onUpdate?: (task: TaskEntity, updates: Partial<TaskEntity>) => void;
    onArchive?: (task: TaskEntity) => void;
    highlight?: boolean;
    isSelected?: boolean;
    onSelect?: (task: TaskEntity) => void;
}

const TaskRowComponent: React.FC<TaskRowProps> = ({ 
    task, allTasks, tags, onComplete, onFocus, onScheduleToday, onDelete, onUpdate, onArchive, highlight,
    isSelected, onSelect
}) => {
    const { isCompleted, isArchived, isBlocked, isOverdue, displayedDuration } = useTaskDisplayInfo(task, allTasks);
    const { timeDisplay, isRunning } = useTaskTimer(task);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);

    const isSelectionMode = !!onSelect;

    useEffect(() => {
        if (isCompleting && !isSelectionMode) {
            const timer = setTimeout(() => {
                onComplete(task);
                setIsCompleting(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isCompleting, onComplete, task, isSelectionMode]);

    const taskTag = tags.find(t => t.id === task.category);

    const handleCompleteChange = (checked: boolean) => {
        if (isSelectionMode) {
            onSelect?.(task);
            return;
        }
        if (checked) {
            setIsCompleting(true);
        } else {
            onComplete(task);
        }
    };

    const handleRowClick = () => {
        if (isSelectionMode) {
            onSelect?.(task);
            return;
        }
        setIsSheetOpen(true);
    };

    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger>
                    <div
                        className={cn(
                            "group flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all",
                            "hover:bg-accent/40 active:bg-accent/60 cursor-pointer",
                            isBlocked && !isArchived && "opacity-50",
                            (isCompleted || isCompleting) && !isSelectionMode && "opacity-60",
                            highlight && "bg-primary/5 border-primary/20",
                            isCompleting && !isSelectionMode && "opacity-0",
                            isSelected && isSelectionMode && "bg-accent/50",
                            "mx-1 my-0.5 relative"
                        )}
                        onClick={handleRowClick}
                    >
                        <div className="flex w-full flex-col gap-1">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <div onClick={(e) => e.stopPropagation()} className="flex items-center mt-0.5 relative">
                                        {task.energy === 'High' && !isCompleted && !isCompleting && (
                                            <span className="absolute -left-2 top-1.5 flex h-2 w-2 rounded-full bg-blue-600" />
                                        )}
                                        <Checkbox
                                            checked={isSelectionMode ? isSelected : (isCompleted || isCompleting)}
                                            onCheckedChange={handleCompleteChange}
                                            disabled={isBlocked && !isArchived && !isSelectionMode}
                                            className="h-4 w-4"
                                        />
                                    </div>
                                    <div className={cn(
                                        "font-semibold text-sm leading-tight",
                                        (isCompleted || isCompleting) && "line-through text-muted-foreground"
                                    )}>
                                        {task.title}
                                    </div>
                                </div>
                                <div className={cn(
                                    "text-xs whitespace-nowrap pt-0.5",
                                    isSelected ? "text-foreground" : "text-muted-foreground"
                                )}>
                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : (task.assignedDate ? new Date(task.assignedDate).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : '')}
                                </div>
                            </div>
                        </div>
                        {task.notes && (
                            <div className="line-clamp-2 text-xs text-muted-foreground/80 pl-7 leading-normal">
                                {task.notes}
                            </div>
                        )}
                        <div className="flex items-center gap-2 pl-7 mt-1">
                            {/* Tag Badge */}
                            <Badge variant={isSelected ? "default" : "secondary"} className="text-[10px] px-2 py-0 rounded-sm whitespace-nowrap font-medium tracking-tight" style={!isSelected ? {
                                borderColor: taskTag ? `${taskTag.color}33` : undefined,
                                color: taskTag?.color,
                                backgroundColor: taskTag ? `${taskTag.color}08` : undefined
                            } : undefined}>
                                <Hash size={10} className="mr-1 shrink-0 opacity-70" />
                                {taskTag?.name || 'Inbox'}
                            </Badge>

                            {/* Timer / Duration Badge */}
                            {isRunning && timeDisplay ? (
                                <Badge variant="outline" className="text-[10px] px-2 py-0 rounded-sm whitespace-nowrap font-mono text-primary border-primary/20 bg-primary/5 animate-pulse">
                                    {timeDisplay}
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-[10px] px-2 py-0 rounded-sm whitespace-nowrap font-medium text-muted-foreground border-border/50 bg-muted/20">
                                    <Clock size={10} className="mr-1 shrink-0 opacity-70" />
                                    {displayedDuration}m
                                </Badge>
                            )}

                            {/* Energy Badge */}
                            <Badge variant="outline" className={cn(
                                "text-[10px] px-2 py-0 rounded-sm whitespace-nowrap font-medium",
                                task.energy === 'High' ? "text-orange-500/90 border-orange-500/10 bg-orange-500/5" :
                                task.energy === 'Low' ? "text-emerald-500/90 border-emerald-500/10 bg-emerald-500/5" :
                                "text-yellow-500/90 border-yellow-500/10 bg-yellow-500/5"
                            )}>
                                <Zap size={10} className="mr-1 shrink-0 opacity-70" />
                                {task.energy === 'Medium' ? 'Med' : task.energy}
                            </Badge>

                            {task.recurrence && <Repeat size={10} className="text-muted-foreground/30 ml-auto" />}
                        </div>
                    </div>
                </ContextMenuTrigger>

                <ContextMenuContent className="w-48">
                    {!isCompleted && !isArchived && !isBlocked && (
                        <ContextMenuItem onClick={() => onFocus(task)}>
                            <Play size={14} className="mr-2" />
                            Start Focus
                        </ContextMenuItem>
                    )}
                    {!isCompleted && !isArchived && onScheduleToday && (
                        <ContextMenuItem onClick={() => onScheduleToday(task)}>
                            <Sun size={14} className="mr-2" />
                            Schedule for Today
                        </ContextMenuItem>
                    )}
                    <ContextMenuItem onClick={() => setIsSheetOpen(true)}>
                        <Edit2 size={14} className="mr-2" />
                        Edit Details
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    {!isArchived && onArchive && (
                        <ContextMenuItem onClick={() => onArchive(task)}>
                            <Archive size={14} className="mr-2 text-muted-foreground" />
                            Archive Task
                        </ContextMenuItem>
                    )}
                    {onDelete && (
                        <ContextMenuItem onClick={() => onDelete(task.id)} className="text-destructive">
                            <Trash2 size={14} className="mr-2" />
                            Delete Permanently
                        </ContextMenuItem>
                    )}
                </ContextMenuContent>
            </ContextMenu>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-md overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Task Details</SheetTitle>
                    </SheetHeader>
                    {onUpdate && (
                        <TaskDetailsSheetContent
                            task={task}
                            allTasks={allTasks}
                            tags={tags}
                            onUpdate={onUpdate}
                            onClose={() => setIsSheetOpen(false)}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
};

export const TaskRow = memo(TaskRowComponent);
