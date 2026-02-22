
import { useState, useEffect } from 'react';
import { useUserId } from '@/hooks/useFirestore';
import { useTaskContext } from '@/context/TaskContext';
import { TaskService } from '@/services/TaskService';
import { calculateTaskTime, formatTimer } from '@/utils/timeUtils';
import { useNavigation } from '@/context/NavigationContext';
import { TaskEntity } from '@/types';

export const useFocusSessionController = (taskId: string | undefined) => {
  const uid = useUserId();
  const { tasks } = useTaskContext();
  const { startBreathing, completeFocusSession, clearFocusSession } = useNavigation();
  const task = tasks.find(t => t.id === taskId) || null;
  
  const metrics = calculateTaskTime(task);
  const [timeLeft, setTimeLeft] = useState(metrics.remaining);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  
  const isActive = metrics.status === 'running';

  const taskService = TaskService.getInstance();

  useEffect(() => {
    if (task && uid && !hasAutoStarted) {
      if (!isActive) {
         taskService.startSession(task.id, metrics.remaining, tasks);
      }
      setHasAutoStarted(true);
    }
  }, [task, uid, hasAutoStarted, isActive, metrics.remaining, taskService, tasks]);

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

  const toggleTimer = () => {
    if (!task || !uid) return;

    if (isActive) {
      taskService.pauseSession(task.id, timeLeft);
    } else {
      taskService.startSession(task.id, timeLeft, tasks);
    }
  };

  const stopCurrentSession = () => {
    if (!task || !uid) return;
    taskService.stopSession(task.id, timeLeft);
    clearFocusSession();
  };

  const handleBreathing = () => {
    if (isActive && task) {
       taskService.pauseSession(task.id, timeLeft);
    }
    startBreathing();
  };

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
