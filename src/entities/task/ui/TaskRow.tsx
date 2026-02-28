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
}

const TaskRowComponent: React.FC<TaskRowProps> = ({ 
    task, allTasks, tags, onComplete, onFocus, onScheduleToday, onDelete, onUpdate, onArchive, highlight
}) => {
    const { isCompleted, isArchived, isBlocked, isOverdue, displayedDuration } = useTaskDisplayInfo(task, allTasks);
    const { timeDisplay, isRunning } = useTaskTimer(task);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);

    useEffect(() => {
        if (isCompleting) {
            const timer = setTimeout(() => {
                onComplete(task);
                setIsCompleting(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isCompleting, onComplete, task]);

    const taskTag = tags.find(t => t.id === task.category);

    const handleCompleteChange = (checked: boolean) => {
        if (checked) {
            setIsCompleting(true);
        } else {
            onComplete(task); // This will handle uncompleting if it was already completed
        }
    };

    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger>
                    <div
                        className={cn(
                            "group flex items-center gap-3 py-2 px-3 border-b border-border last:border-0 transition-all duration-200 cursor-pointer hover:bg-muted/50",
                            isBlocked && !isArchived && "opacity-50",
                            (isCompleted || isCompleting) && "opacity-60",
                            highlight && "bg-primary/5",
                            isCompleting && "opacity-0"
                        )}
                        onClick={() => setIsSheetOpen(true)}
                    >
                        <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                            <Checkbox
                                checked={isCompleted || isCompleting}
                                onCheckedChange={handleCompleteChange}
                                disabled={isBlocked && !isArchived}
                            />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <span className={cn(
                                "text-sm font-medium truncate",
                                (isCompleted || isCompleting) && "line-through text-muted-foreground"
                            )}>
                                {task.title}
                            </span>

                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Tag Badge */}
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal" style={{
                                    borderColor: taskTag ? `${taskTag.color}44` : undefined,
                                    color: taskTag?.color,
                                    backgroundColor: taskTag ? `${taskTag.color}11` : undefined
                                }}>
                                    <Hash size={10} className="mr-1" />
                                    {taskTag?.name || 'Inbox'}
                                </Badge>

                                {/* Date Badges */}
                                {task.assignedDate && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal text-primary border-primary/20 bg-primary/5">
                                        <CalendarClock size={10} className="mr-1" />
                                        {new Date(task.assignedDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                    </Badge>
                                )}

                                {task.dueDate && (
                                    <Badge variant="outline" className={cn(
                                        "text-[10px] px-1.5 py-0 h-4 font-normal",
                                        isOverdue ? "text-destructive border-destructive/20 bg-destructive/5 font-bold" : "text-muted-foreground border-border bg-muted/30"
                                    )}>
                                        <Calendar size={10} className="mr-1" />
                                        {new Date(task.dueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                    </Badge>
                                )}

                                {/* Timer / Duration Badge */}
                                {isRunning && timeDisplay ? (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono text-primary border-primary/20 bg-primary/5 animate-pulse">
                                        {timeDisplay}
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal text-muted-foreground border-border bg-muted/30">
                                        <Clock size={10} className="mr-1" />
                                        {displayedDuration}m
                                    </Badge>
                                )}

                                {/* Energy Badge */}
                                <Badge variant="outline" className={cn(
                                    "text-[10px] px-1.5 py-0 h-4 font-normal",
                                    task.energy === 'High' ? "text-orange-500 border-orange-500/20 bg-orange-500/5" :
                                    task.energy === 'Low' ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" :
                                    "text-yellow-500 border-yellow-500/20 bg-yellow-500/5"
                                )}>
                                    <Zap size={10} className="mr-1" />
                                    {task.energy === 'Medium' ? 'Med' : task.energy}
                                </Badge>

                                {task.recurrence && <Repeat size={10} className="text-muted-foreground/50" />}
                                {(task.blockedBy?.length || 0) > 0 && <GitBranch size={10} className="text-blue-500/50" />}
                            </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal size={14} className="text-muted-foreground" />
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
