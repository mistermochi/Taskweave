
import React from 'react';

interface TaskDisplayProps {
    title: string;
    notes: string | null | undefined;
    isCompleted: boolean;
}

export const TaskDisplay: React.FC<TaskDisplayProps> = ({ title, notes, isCompleted }) => {
    return (
        <>
            <span className={`text-sm font-medium leading-snug break-words ${isCompleted ? 'line-through text-secondary' : 'text-foreground'}`}>{title}</span>
            {notes && <p className="text-xs truncate mt-0.5 text-secondary/60">{notes}</p>}
        </>
    );
};
