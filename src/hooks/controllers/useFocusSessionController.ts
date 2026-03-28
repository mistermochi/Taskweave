import { useState, useEffect, useCallback, useRef } from 'react';
import { useUserId } from '@/hooks/useFirestore';
import { useTaskContext } from '@/context/TaskContext';
import { taskApi } from '@/entities/task';
import { calculateTaskTime, formatTimer } from '@/shared/lib/timeUtils';
import { useNavigation } from '@/context/NavigationContext';
import { TaskEntity } from '@/entities/task';
import { useTaskAppStore } from '@/features/task-app/use-task-app';
import { vibrate } from '@/shared/lib/utils';

/**
 * View Controller for an active Focus Session.
 * Manages the transition from a running timer to the post-session summary,
 * handles auto-start logic, and coordinates with the Task Service for persistence.
 *
 * @param taskId - The unique ID of the task being focused on.
 * @returns State (active task, time left, formatted display) and Actions (toggle, complete, stop).
 */
export const useFocusSessionController = (taskId: string | undefined) => {
  const uid = useUserId();
  const { tasks } = useTaskContext();
  const { startBreathing, completeFocusSession, clearFocusSession } = useNavigation();
  const task = tasks.find(t => t.id === taskId) || null;
  
  const metrics = calculateTaskTime(task);
  const [timeLeft, setTimeLeft] = useState(metrics.remaining);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  
  const isActive = metrics.status === 'running';

  // Use a ref for timeLeft to keep action callbacks stable
  const timeLeftRef = useRef(timeLeft);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  /**
   * Auto-start logic: Automatically begins the focus session
   * the first time the view is mounted with a valid task ID.
   */
  useEffect(() => {
    if (task && uid && !hasAutoStarted) {
      // If the task is already marked as focused in the DB but not currently "running" (no lastStartedAt),
      // it means it's a restored paused session. We should NOT auto-start it.
      if (!isActive && !task.isFocused) {
         taskApi.startSession(task.id, metrics.remaining, tasks);
      }
      setHasAutoStarted(true);
    }
  }, [task, uid, hasAutoStarted, isActive, metrics.remaining, tasks]);

  /**
   * Local animation loop for the timer.
   * Updates every second to provide smooth UI feedback while relying on
   * `calculateTaskTime` for accuracy.
   */
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (isActive) {
      interval = setInterval(() => {
        const currentMetrics = calculateTaskTime(task);
        setTimeLeft(currentMetrics.remaining);
      }, 1000);
    } else {
      const currentMetrics = calculateTaskTime(task);
      setTimeLeft(currentMetrics.remaining);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, task]);

  /**
   * Toggles between Start and Pause for the current focus session.
   */
  const toggleTimer = useCallback(() => {
    if (!task || !uid) return;

    if (isActive) {
      taskApi.pauseSession(task.id, timeLeftRef.current);
    } else {
      taskApi.startSession(task.id, timeLeftRef.current, tasks);
    }
    vibrate('light');
  }, [task, uid, isActive, tasks]);

  /**
   * Stops the session and returns to the previous view without completing the task.
   */
  const stopCurrentSession = useCallback(() => {
    if (!task || !uid) return;
    taskApi.stopSession(task.id, timeLeftRef.current);
    clearFocusSession();
    vibrate('light');
  }, [task, uid, clearFocusSession]);

  /**
   * Pauses the timer and navigates to the breathing exercise view.
   */
  const handleBreathing = useCallback(() => {
    if (isActive && task) {
       taskApi.pauseSession(task.id, timeLeftRef.current);
    }
    startBreathing();
    vibrate('light');
  }, [isActive, task, startBreathing]);

  /**
   * Finishes the current focus session, marks the task as complete,
   * and triggers the Session Summary dialog for reflection.
   */
  const completeSession = useCallback(async () => {
    if (task && uid) {
        // Calculate actual time spent before marking as complete
        const totalSeconds = task.duration * 60;
        const actualSeconds = totalSeconds - timeLeftRef.current;
        const activeTasks = tasks.filter(t => t.status === 'active');

        // 1. Mark task as complete optimistically
        const completedAt = Date.now();
        useTaskAppStore.getState().setOptimisticTask(task.id, {
            status: 'completed',
            completedAt,
            updatedAt: completedAt,
            actualDuration: Math.max(0, actualSeconds),
            remainingSeconds: null,
            lastStartedAt: null,
            isFocused: false
        });

        // 2. Immediately mark task as complete and adjust duration in Firestore
        // This ensures the task is saved even if the user closes the summary modal
        await taskApi.completeTask(task, actualSeconds, activeTasks);

        // 3. Clear focus selection and move to done tab in background
        useTaskAppStore.getState().setSelectedTask(null);
        useTaskAppStore.getState().setTaskTab('done');

        // 4. Trigger the summary modal for reflection
        completeFocusSession(task.id);
        vibrate('success');
    } else {
        completeFocusSession(task?.id);
    }
  }, [task, uid, tasks, completeFocusSession]);

  return {
    state: {
      task,
      timeLeft,
      isActive,
      isLoading: !task && !!taskId,
      formattedTime: formatTimer(timeLeft)
    },
    actions: {
      toggleTimer,
      completeSession,
      handleBreathing,
      stopCurrentSession
    }
  };
};
