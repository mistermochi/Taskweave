
'use client';

import React, { useRef, useEffect } from 'react';

interface TaskInputProps {
    title: string;
    notes: string;
    onTitleChange: (value: string) => void;
    onNotesChange: (value: string) => void;
    onSaveChanges: () => void;
    onDiscard: () => void;
    isEditing: boolean;
}

export const TaskInput: React.FC<TaskInputProps> = ({ title, notes, onTitleChange, onNotesChange, onSaveChanges, onDiscard, isEditing }) => {
    const titleRef = useRef<HTMLTextAreaElement>(null);
    const notesRef = useRef<HTMLTextAreaElement>(null);

    const autoResize = (el: HTMLTextAreaElement | null) => {
        if (el) {
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
        }
    };

    useEffect(() => {
        if (isEditing) {
            autoResize(titleRef.current);
            autoResize(notesRef.current);
            titleRef.current?.focus();
        }
    }, [isEditing]);

    return (
        <>
            <textarea 
                ref={titleRef}
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onSaveChanges(); } else if (e.key === 'Escape') { onDiscard(); } }}
                className="bg-transparent border-none p-0 text-sm font-medium text-foreground focus:ring-0 leading-snug w-full resize-none overflow-hidden block placeholder-secondary/50"
                placeholder="Task name"
                rows={1}
            />
            <textarea 
                ref={notesRef}
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                className="bg-transparent border-none p-0 text-xs text-secondary/80 focus:ring-0 leading-snug w-full resize-none overflow-hidden block mt-2 placeholder-secondary/30"
                placeholder="Notes..."
                rows={1}
            />
        </>
    );
};
