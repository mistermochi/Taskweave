'use client';

import React from 'react';
import { Check, Edit2, Play, Sun, ArchiveRestore, Archive } from 'lucide-react';
import { TaskEntity } from '@/types';

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
        <div 
            className={`
                absolute right-2 top-2 flex items-center gap-1 p-1 rounded-lg bg-surface border border-border shadow-lg z-20 
                transition-all duration-200 
                ${(showActions || isEditing) 
                    ? 'opacity-100 translate-y-0 pointer-events-auto' 
                    : `opacity-0 translate-y-1 pointer-events-none ${isHoverCapable ? 'group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto' : ''}`
                }
            `}
        >
            {/* Restore from Archive */}
            {isArchived && (
                <button onClick={(e) => { e.stopPropagation(); onComplete(task); }} className="p-1.5 text-secondary hover:text-foreground rounded hover:bg-foreground/10" title="Restore"><ArchiveRestore size={14} /></button>
            )}
            
            {/* Quick Schedule */}
            {onScheduleToday && !isCompleted && !isArchived && !isEditing && !isBlocked && (
                <button onClick={(e) => { e.stopPropagation(); onScheduleToday(task); }} className="p-1.5 text-secondary hover:text-yellow-400 rounded hover:bg-foreground/10" title="Do Today"><Sun size={14} /></button>
            )}
            
            {/* Save vs Edit toggle */}
            {isEditing ? (
                <button onClick={(e) => { e.stopPropagation(); onSave(); }} className="p-1.5 text-primary bg-primary/10 rounded hover:bg-primary/20" title="Save"><Check size={14} /></button>
            ) : !isCompleted && !isArchived && (
                <button onClick={(e) => { e.stopPropagation(); onEnterEditMode(); }} className="p-1.5 text-secondary hover:text-foreground rounded hover:bg-foreground/10" title="Edit"><Edit2 size={14} /></button>
            )}

            {/* Archival */}
            {!isArchived && !isCompleted && onArchive && (
                <button onClick={(e) => { e.stopPropagation(); onArchive(task); }} className="p-1.5 text-secondary hover:text-red-400 rounded hover:bg-foreground/10" title="Archive"><Archive size={14} /></button>
            )}

            {/* Focus Session Trigger */}
            {!isCompleted && !isEditing && !isBlocked && (
                <button onClick={(e) => { e.stopPropagation(); onFocus(task); }} className="p-1.5 text-secondary hover:text-primary rounded hover:bg-primary/10" title="Focus"><Play size={14} /></button>
            )}
        </div>
    );
};
