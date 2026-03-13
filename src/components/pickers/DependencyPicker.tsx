'use client';

import React from 'react';
import { TaskEntity } from '@/entities/task';
import { Check, Layers } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { ScrollArea } from '@/shared/ui/ui/scroll-area';

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
    <div className="space-y-2">
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">{title}</h4>
        <ScrollArea className="h-40 pr-3">
            <div className="space-y-1">
                {tasks.length > 0 ? tasks.map(task => {
                    const isSelected = selectedIds.has(task.id);
                    return (
                        <button
                            key={task.id}
                            onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
                            className={cn(
                                "w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-accent text-left transition-colors",
                                isSelected && "bg-accent/50"
                            )}
                        >
                            <div className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0",
                                isSelected ? "bg-primary border-primary" : "border-muted-foreground/30 bg-muted/30"
                            )}>
                                {isSelected && <Check size={12} className="text-primary-foreground" strokeWidth={3} />}
                            </div>
                            <span className={cn(
                                "text-xs truncate flex-1",
                                isSelected ? "text-foreground font-medium" : "text-muted-foreground"
                            )}>
                                {task.title}
                            </span>
                        </button>
                    );
                }) : (
                    <p className="text-[10px] text-muted-foreground/60 p-4 text-center italic">No other active tasks.</p>
                )}
            </div>
        </ScrollArea>
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
        <div className="w-64 space-y-3">
            <div className="flex items-center gap-2 px-1">
                <Layers size={14} className="text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Set Dependencies</span>
            </div>
            <DependencySection
                title="This task is blocked by:"
                tasks={otherTasks}
                selectedIds={new Set(selectedIds)}
                onToggle={toggleId}
            />
        </div>
    );
};
