
'use client';

import React from 'react';
import { Check, Edit2, Play, Sun, ArchiveRestore, Archive } from 'lucide-react';
import { TaskEntity } from '@/types';

interface TaskRowActionsProps {
    task: TaskEntity;
    isEditing: boolean;
    isArchived: boolean;
    isCompleted: boolean;
    isBlocked: boolean;
    showActions: boolean;
    isHoverCapable: boolean;
    onScheduleToday?: (task: TaskEntity) => void;
    onArchive?: (task: TaskEntity) => void;
    onComplete: (task: TaskEntity) => void;
    onFocus: (task: TaskEntity) => void;
    onSave: () => void;
    onEnterEditMode: () => void;
}

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
            {isArchived && (
                <button onClick={(e) => { e.stopPropagation(); onComplete(task); }} className="p-1.5 text-secondary hover:text-foreground rounded hover:bg-foreground/10" title="Restore"><ArchiveRestore size={14} /></button>
            )}
            
            {onScheduleToday && !isCompleted && !isArchived && !isEditing && !isBlocked && (
                <button onClick={(e) => { e.stopPropagation(); onScheduleToday(task); }} className="p-1.5 text-secondary hover:text-yellow-400 rounded hover:bg-foreground/10" title="Do Today"><Sun size={14} /></button>
            )}
            
            {isEditing ? (
                <button onClick={(e) => { e.stopPropagation(); onSave(); }} className="p-1.5 text-primary bg-primary/10 rounded hover:bg-primary/20" title="Save"><Check size={14} /></button>
            ) : !isCompleted && !isArchived && (
                <button onClick={(e) => { e.stopPropagation(); onEnterEditMode(); }} className="p-1.5 text-secondary hover:text-foreground rounded hover:bg-foreground/10" title="Edit"><Edit2 size={14} /></button>
            )}

            {!isArchived && !isCompleted && onArchive && (
                <button onClick={(e) => { e.stopPropagation(); onArchive(task); }} className="p-1.5 text-secondary hover:text-red-400 rounded hover:bg-foreground/10" title="Archive"><Archive size={14} /></button>
            )}

            {!isCompleted && !isEditing && !isBlocked && (
                <button onClick={(e) => { e.stopPropagation(); onFocus(task); }} className="p-1.5 text-secondary hover:text-primary rounded hover:bg-primary/10" title="Focus"><Play size={14} /></button>
            )}
        </div>
    );
};
