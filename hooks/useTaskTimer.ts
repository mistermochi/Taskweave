import { useState, useEffect, useMemo } from 'react';
import { TaskEntity } from '../types';
import { calculateTaskTime, formatTimer } from '../utils/timeUtils';

/**
 * Interface representing the state of a task timer hook.
 */
interface UseTaskTimerResult {
    /** The formatted countdown string (e.g., "25:00"). */
    timeDisplay: string | null;
    /** Whether the timer is currently running. */
    isRunning: boolean;
    /** Whether the timer has exceeded the task's estimated duration. */
    isOvertime: boolean;
}

/**
 * Hook that manages the live countdown for a focused task.
 * It automatically updates every second when the task is active.
 *
 * @param task - The task entity to track.
 * @returns Object containing the display time and timer state.
 */
export const useTaskTimer = (task: TaskEntity): UseTaskTimerResult => {
    const [timeDisplay, setTimeDisplay] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isOvertime, setIsOvertime] = useState(false);

    useEffect(() => {
        if (!task.isFocused) {
            setTimeDisplay(null);
            setIsRunning(false);
            return;
        }

        const updateTimer = () => {
            const metrics = calculateTaskTime(task);
            setTimeDisplay(formatTimer(metrics.remaining));
            setIsRunning(metrics.status === 'running');
            setIsOvertime(metrics.isOvertime);
        };

        updateTimer();

        if (task.lastStartedAt) {
            const interval = setInterval(updateTimer, 1000);
            return () => clearInterval(interval);
        }
    }, [task, task.isFocused, task.lastStartedAt, task.remainingSeconds]);

    return { timeDisplay, isRunning, isOvertime };
};

/**
 * Hook that calculates and caches display-specific flags and metadata for a task.
 * Simplifies UI components by abstracting complex conditional logic for task states.
 *
 * @param task - The task to analyze.
 * @param allTasks - Optional list of all tasks to resolve dependencies.
 * @returns Metadata flags (isCompleted, isBlocked, isOverdue, etc.).
 */
export const useTaskDisplayInfo = (task: TaskEntity, allTasks: TaskEntity[] | undefined) => {
    const isCompleted = task.status === 'completed';
    const isArchived = task.status === 'archived';
    
    /**
     * Identifies all tasks that are currently blocking this task
     * (i.e., listed in `blockedBy` and not yet completed).
     */
    const activeBlockers = useMemo(() => {
        if (!task.blockedBy || task.blockedBy.length === 0 || !allTasks) return [];
        return task.blockedBy.map(id => allTasks.find(t => t.id === id)).filter(t => t && t.status !== 'completed');
    }, [task.blockedBy, allTasks]);
    
    const isBlocked = activeBlockers.length > 0;
    const isOverdue = task.dueDate && task.dueDate < Date.now() && !isCompleted && !isArchived;

    /**
     * Determines which duration value to display.
     * For completed tasks, it shows the actual time spent.
     */
    const displayedDuration = useMemo(() => {
        if (isCompleted && typeof task.actualDuration === 'number') {
            return Math.max(1, Math.round(task.actualDuration / 60));
        }
        return task.duration;
    }, [isCompleted, task.actualDuration, task.duration]);

    return { isCompleted, isArchived, activeBlockers, isBlocked, isOverdue, displayedDuration };
};
