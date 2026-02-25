'use client';

import React from 'react';
import { TaskEntity } from '@/types';
import { Check } from 'lucide-react';
import { PickerContainer } from './PickerContainer';

/**
 * Interface for DependencyPicker props.
 */
interface DependencyPickerProps {
    /** List of all tasks for potential dependency matching. */
    allTasks: TaskEntity[];
    /** ID of the task currently being edited (to prevent self-dependency). */
    currentTaskId: string;
    /** Array of task IDs that are currently blocking this task. */
    selectedIds: string[];
    /** Callback triggered when the dependency list is updated. */
    onIdsChange: (ids: string[]) => void;
}

/**
 * Internal sub-component for rendering a group of potential blockers.
 */
const DependencySection: React.FC<{
    title: string;
    tasks: TaskEntity[];
    selectedIds: Set<string>;
    onToggle: (id: string) => void;
}> = ({ title, tasks, selectedIds, onToggle }) => (
    <div>
        <h4 className="text-xxs font-bold text-secondary uppercase tracking-wider px-1 mb-1">{title}</h4>
        <div className="max-h-40 overflow-y-auto no-scrollbar pr-1">
            {tasks.length > 0 ? tasks.map(task => (
                <button 
                    key={task.id}
                    onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
                    className="w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-foreground/5 text-left"
                >
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${selectedIds.has(task.id) ? 'bg-primary border-primary' : 'border-border bg-foreground/5'}`}>
                        {selectedIds.has(task.id) && <Check size={10} className="text-primary-foreground" strokeWidth={3} />}
                    </div>
                    <span className="text-xs text-foreground truncate flex-1">{task.title}</span>
                </button>
            )) : <p className="text-xs text-secondary/50 p-2 text-center">No other tasks.</p>}
        </div>
    </div>
);

/**
 * UI component for selecting task dependencies.
 * It displays a list of active tasks that the current task is "blocked by".
 *
 * @component
 */
export const DependencyPicker: React.FC<DependencyPickerProps> = ({
    allTasks,
    currentTaskId,
    selectedIds,
    onIdsChange,
}) => {
    // Filter out the task itself to prevent circular dependencies.
    const otherTasks = allTasks.filter(t => t.id !== currentTaskId && t.status === 'active');
    
    const toggleId = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        onIdsChange(Array.from(newSet));
    };

    return (
        <PickerContainer title="Set Dependencies" className="w-64">
            <div className="space-y-3">
                <DependencySection 
                    title="This task is blocked by:"
                    tasks={otherTasks}
                    selectedIds={new Set(selectedIds)}
                    onToggle={toggleId}
                />
            </div>
        </PickerContainer>
    );
};
