'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Interface for TaskInput props.
 */
interface TaskInputProps {
    /** Current title draft. */
    title: string;
    /** Current notes draft. */
    notes: string;
    /** Callback to update title draft. */
    onTitleChange: (value: string) => void;
    /** Callback to update notes draft. */
    onNotesChange: (value: string) => void;
    /** Callback to save all changes and exit edit mode. */
    onSaveChanges: () => void;
    /** Callback to discard all changes and exit edit mode. */
    onDiscard: () => void;
    /** Whether the component is active in edit mode. */
    isEditing: boolean;
}

/**
 * Editing interface for a task row.
 * Consists of two auto-resizing textareas for the title and notes.
 * Supports keyboard shortcuts like Enter (Save) and Escape (Discard).
 *
 * @component
 * @interaction
 * - Automatically focuses the title field when entering edit mode.
 * - Dynamically adjusts textarea height based on content length.
 */
export const TaskInput: React.FC<TaskInputProps> = ({ title, notes, onTitleChange, onNotesChange, onSaveChanges, onDiscard, isEditing }) => {
    const titleRef = useRef<HTMLTextAreaElement>(null);
    const notesRef = useRef<HTMLTextAreaElement>(null);

    /**
     * Helper to adjust the height of a textarea DOM element.
     */
    const autoResize = (el: HTMLTextAreaElement | null) => {
        if (el) {
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
        }
    };

    /**
     * Triggers initial auto-resize and focus.
     */
    useEffect(() => {
        if (isEditing) {
            autoResize(titleRef.current);
            autoResize(notesRef.current);
            titleRef.current?.focus();
        }
    }, [isEditing]);

    const commonClasses = "bg-transparent border-none p-0 focus:ring-0 leading-snug w-full resize-none overflow-hidden block";

    return (
        <div className="grid gap-1">
            <textarea 
                ref={titleRef}
                value={title}
                onChange={(e) => { onTitleChange(e.target.value); autoResize(e.target); }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        onSaveChanges();
                    } else if (e.key === 'Escape') {
                        onDiscard();
                    }
                }}
                className={cn(commonClasses, "text-sm font-medium text-foreground placeholder-muted-foreground/50")}
                placeholder="Task name"
                rows={1}
            />
            <textarea 
                ref={notesRef}
                value={notes}
                onChange={(e) => { onNotesChange(e.target.value); autoResize(e.target); }}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        onDiscard();
                    }
                }}
                className={cn(commonClasses, "text-xs text-muted-foreground placeholder-muted-foreground/30")}
                placeholder="Notes..."
                rows={1}
            />
        </div>
    );
};
