import React from 'react';

/**
 * Interface for TaskDisplay props.
 */
interface TaskDisplayProps {
    /** The main title text of the task. */
    title: string;
    /** Optional descriptive notes for the task. */
    notes: string | null | undefined;
    /** Whether the task is currently in a completed state (applies strikethrough). */
    isCompleted: boolean;
}

/**
 * Presentational component for the title and notes section of a task row.
 * It handles the base typography and visual "checked" state.
 *
 * @component
 */
export const TaskDisplay: React.FC<TaskDisplayProps> = ({ title, notes, isCompleted }) => {
    return (
        <>
            <span className={`text-sm font-medium leading-snug break-words ${isCompleted ? 'line-through text-secondary' : 'text-foreground'}`}>
                {title}
            </span>
            {notes && (
                <p className="text-xs truncate mt-0.5 text-secondary/60">
                    {notes}
                </p>
            )}
        </>
    );
};
