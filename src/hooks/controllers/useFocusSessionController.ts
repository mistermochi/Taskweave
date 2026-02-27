import { useState, useEffect } from 'react';
import { useUserId } from '@/hooks/useFirestore';
import { useTaskContext } from '@/context/TaskContext';
import { taskApi } from '@/entities/task';
import { calculateTaskTime, formatTimer } from '@/shared/lib/timeUtils';
import { useNavigation } from '@/context/NavigationContext';
import { TaskEntity } from '@/entities/task';

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

  const taskService = taskApi;

  /**
   * Auto-start logic: Automatically begins the focus session
   * the first time the view is mounted with a valid task ID.
   */
  useEffect(() => {
    if (task && uid && !hasAutoStarted) {
      if (!isActive) {
         taskService.startSession(task.id, metrics.remaining, tasks);
      }
      setHasAutoStarted(true);
    }
  }, [task, uid, hasAutoStarted, isActive, metrics.remaining, taskService, tasks]);

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
  const toggleTimer = () => {
    if (!task || !uid) return;

    if (isActive) {
      taskService.pauseSession(task.id, timeLeft);
    } else {
      taskService.startSession(task.id, timeLeft, tasks);
    }
  };

  /**
   * Stops the session and returns to the previous view without completing the task.
   */
  const stopCurrentSession = () => {
    if (!task || !uid) return;
    taskService.stopSession(task.id, timeLeft);
    clearFocusSession();
  };

  /**
   * Pauses the timer and navigates to the breathing exercise view.
   */
  const handleBreathing = () => {
    if (isActive && task) {
       taskService.pauseSession(task.id, timeLeft);
    }
    startBreathing();
  };

  /**
   * Marks the task as completed and transitions to the Reflection (Session Summary) view.
   */
  const completeSession = async () => {
    if (task && uid) {
        const totalSeconds = task.duration * 60;
        const actualSeconds = totalSeconds - timeLeft;
        const activeTasks = tasks.filter(t => t.status === 'active');
        await taskService.completeTask(task, actualSeconds, activeTasks);
    }
    completeFocusSession(task?.id);
  };

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
