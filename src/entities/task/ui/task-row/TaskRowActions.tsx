'use client';

import React from 'react';
import { Check, Edit2, Play, Sun, ArchiveRestore, Archive } from 'lucide-react';
import { TaskEntity } from '@/entities/task';
import { Button } from '@/shared/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';

/**
 * Interface for TaskRowActions props.
 */
interface TaskRowActionsProps {
    /** The task entity associated with these actions. */
    task: TaskEntity;
    /** Whether the parent row is currently in edit mode. */
    isEditing: boolean;
    /** Whether the task is currently archived. */
    isArchived: boolean;
    /** Whether the task is currently completed. */
    isCompleted: boolean;
    /** Whether the task is currently blocked by another task. */
    isBlocked: boolean;
    /** Whether the action bar should be explicitly shown (mobile fallback). */
    showActions: boolean;
    /** Whether the device supports hover interactions. */
    isHoverCapable: boolean;
    /** Optional callback to schedule the task for today. */
    onScheduleToday?: (task: TaskEntity) => void;
    /** Optional callback to archive the task. */
    onArchive?: (task: TaskEntity) => void;
    /** Callback to finalize task completion or restore from archive. */
    onComplete: (task: TaskEntity) => void;
    /** Callback to start a focus session for this task. */
    onFocus: (task: TaskEntity) => void;
    /** Callback to save inline edits. */
    onSave: () => void;
    /** Callback to manually enter edit mode. */
    onEnterEditMode: () => void;
}

/**
 * A floating action bar for task-specific operations.
 * It provides context-aware buttons (Edit, Archive, Focus, Restore)
 * that appear on hover or explicit selection.
 *
 * @component
 * @interaction
 * - Automatically hides/shows based on mouse hover (if capable) or row activation.
 * - Dynamically filters available buttons based on task state (e.g., hides Focus if blocked).
 */
export const TaskRowActions: React.FC<TaskRowActionsProps> = ({
    task,
    isEditing,
    isArchived,
    isCompleted,
    isBlocked,
    showActions,
    isHoverCapable,
    onScheduleToday,
    onArchive,
    onComplete,
    onFocus,
    onSave,
    onEnterEditMode,
}) => {
    return (
        <TooltipProvider>
            <div
                className={`
                    absolute right-2 top-2 flex items-center gap-1 p-1 rounded-sm bg-card border border-border shadow-lg z-20
                    transition-all duration-200
                    ${(showActions || isEditing)
                        ? 'opacity-100 translate-y-0 pointer-events-auto'
                        : `opacity-0 translate-y-1 pointer-events-none ${isHoverCapable ? 'group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto' : ''}`
                    }
                `}
            >
                {/* Restore from Archive */}
                {isArchived && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button aria-label="Restore" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); onComplete(task); }}>
                                <ArchiveRestore size={18} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Restore</p></TooltipContent>
                    </Tooltip>
                )}

                {/* Quick Schedule */}
                {onScheduleToday && !isCompleted && !isArchived && !isEditing && !isBlocked && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button aria-label="Do Today" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-yellow-400" onClick={(e) => { e.stopPropagation(); onScheduleToday(task); }}>
                                <Sun size={18} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Do Today</p></TooltipContent>
                    </Tooltip>
                )}

                {/* Save vs Edit toggle */}
                {isEditing ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button aria-label="Save" variant="secondary" size="icon" className="h-9 w-9 text-primary" onClick={(e) => { e.stopPropagation(); onSave(); }}>
                                <Check size={18} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Save</p></TooltipContent>
                    </Tooltip>
                ) : !isCompleted && !isArchived && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button aria-label="Edit" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); onEnterEditMode(); }}>
                                <Edit2 size={18} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Edit</p></TooltipContent>
                    </Tooltip>
                )}

                {/* Archival */}
                {!isArchived && !isCompleted && onArchive && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button aria-label="Archive" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); onArchive(task); }}>
                                <Archive size={18} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Archive</p></TooltipContent>
                    </Tooltip>
                )}

                {/* Focus Session Trigger */}
                {!isCompleted && !isEditing && !isBlocked && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button aria-label="Focus" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={(e) => { e.stopPropagation(); onFocus(task); }}>
                                <Play size={18} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Focus</p></TooltipContent>
                    </Tooltip>
                )}
            </div>
        </TooltipProvider>
    );
};
