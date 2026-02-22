import { useState, useEffect, useMemo } from 'react';
import { TaskEntity } from '../types';
import { calculateTaskTime, formatTimer } from '../utils/timeUtils';

interface UseTaskTimerResult {
    timeDisplay: string | null;
    isRunning: boolean;
    isOvertime: boolean;
}

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

export const useTaskDisplayInfo = (task: TaskEntity, allTasks: TaskEntity[] | undefined) => {
    const isCompleted = task.status === 'completed';
    const isArchived = task.status === 'archived';
    
    const activeBlockers = useMemo(() => {
        if (!task.blockedBy || task.blockedBy.length === 0 || !allTasks) return [];
        return task.blockedBy.map(id => allTasks.find(t => t.id === id)).filter(t => t && t.status !== 'completed');
    }, [task.blockedBy, allTasks]);
    
    const isBlocked = activeBlockers.length > 0;
    const isOverdue = task.dueDate && task.dueDate < Date.now() && !isCompleted && !isArchived;

    const displayedDuration = useMemo(() => {
        if (isCompleted && typeof task.actualDuration === 'number') {
            return Math.max(1, Math.round(task.actualDuration / 60));
        }
        return task.duration;
    }, [isCompleted, task.actualDuration, task.duration]);

    return { isCompleted, isArchived, activeBlockers, isBlocked, isOverdue, displayedDuration };
};
