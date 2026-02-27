import { useMemo, useState, useEffect } from 'react';
import { db } from '@/shared/api/firebase';
import { doc, setDoc, where } from 'firebase/firestore';
import { useUserId, useFirestoreCollection } from '@/hooks/useFirestore';
import { contextApi } from "@/entities/context";
import { useTaskContext } from '@/context/TaskContext';
import { useVitalsContext } from '@/context/VitalsContext';
import { useReferenceContext } from '@/context/ReferenceContext';
import { useEnergyModel } from '@/hooks/useEnergyModel';
import { getStartOfDay } from '@/shared/lib/timeUtils';
import { taskApi } from '@/entities/task';
import { TaskEntity } from '@/entities/task';
import { calculateSessionImpact } from '@/shared/lib/energyUtils';
import { SuggestionContext } from '@/types/scheduling';
import { RecommendationEngine } from '@/services/RecommendationEngine';

/**
 * View Controller for the main Dashboard interface.
 * Orchestrates task planning, AI recommendations, and energy tracking for the user's "Today" view.
 *
 * @returns State (plans, recommendations, energy levels) and Actions (save mood, complete task).
 */
export const useDashboardController = () => {
  const uid = useUserId();
  const { tasks: activeTasks } = useTaskContext();
  const { vitals } = useVitalsContext();
  const { tags } = useReferenceContext();
  const energyModel = useEnergyModel();
  const taskService = taskApi;

  /** Current AI task recommendation with its reasoning. */
  const [recommendation, setRecommendation] = useState<{ taskId: string; reason: string; } | null>(null);

  /** Real-time subscription to completed tasks for context generation. */
  const { data: completedTasks } = useFirestoreCollection<TaskEntity>('tasks', [where('status', '==', 'completed')]);

  /**
   * Effect that triggers the AI Recommendation Engine whenever relevant context changes.
   */
  useEffect(() => {
    if (activeTasks.length === 0) {
      setRecommendation(null);
      return;
    }
    const calculateRecommendation = async () => {
      try {
        const engine = RecommendationEngine.getInstance();
         // contextService consolidated
        const userContext = await contextApi.getSnapshot();
        const context: SuggestionContext = {
          currentTime: new Date(),
          energy: energyModel.currentEnergy, 
          availableMinutes: 60,
          tasks: activeTasks,
          tags: tags, 
          completedTasks: completedTasks,
          backlogCount: activeTasks.length,
          previousPatterns: [],
          userContext
        };
        const result = await engine.generateSuggestion(context);
        if (result.suggestion && result.suggestion.type === 'task' && result.suggestion.taskId) {
            setRecommendation({ taskId: result.suggestion.taskId, reason: result.suggestion.reason });
        } else {
            setRecommendation(null);
        }
      } catch (e) {
        console.error("Failed to calculate recommendation for dashboard", e);
      }
    };
    calculateRecommendation();
  }, [activeTasks, completedTasks, energyModel.currentEnergy, tags]);
  
  /**
   * Complex calculation for the "Today's Plan" section.
   * Partitions tasks based on focus state, assigned dates, and hard deadlines.
   * Injects AI recommendations into the plan if not already present.
   */
  const { suggestedPlan, overdueTasks, completedCount } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 86400000;

    const isBlocked = (task: TaskEntity, tasks: TaskEntity[]): boolean => {
      if (!task.blockedBy || task.blockedBy.length === 0) return false;
      return task.blockedBy.some(blockerId => tasks.some(t => t.id === blockerId));
    };
    
    let planCandidates = activeTasks.filter(task => {
        if (isBlocked(task, activeTasks)) return false;
        const isAssignedToday = task.assignedDate && task.assignedDate >= startOfToday && task.assignedDate < endOfToday;
        const isDueTodayOrOverdue = task.dueDate && task.dueDate < endOfToday;
        return task.isFocused || isAssignedToday || isDueTodayOrOverdue;
    });

    if (recommendation && recommendation.taskId) {
        const isAlreadyInPlan = planCandidates.some(t => t.id === recommendation.taskId);
        if (!isAlreadyInPlan) {
            const recommendedTask = activeTasks.find(t => t.id === recommendation.taskId);
            if (recommendedTask && !isBlocked(recommendedTask, activeTasks)) {
                planCandidates.push(recommendedTask);
            }
        }
    }

    if (planCandidates.length === 0) {
        const inboxTasks = activeTasks.filter(task => {
            if (isBlocked(task, activeTasks)) return false;
            const isScheduledOrOverdue = (task.assignedDate && task.assignedDate >= startOfToday && task.assignedDate < endOfToday) || (task.dueDate && task.dueDate < endOfToday);
            return !isScheduledOrOverdue;
        });

        if (inboxTasks.length > 0) {
            inboxTasks.sort((a, b) => {
                const durationDiff = a.duration - b.duration;
                if (durationDiff !== 0) return durationDiff;
                return b.createdAt - a.createdAt;
            });
            const bestInboxTask = inboxTasks[0];
            if (bestInboxTask) {
                planCandidates.push(bestInboxTask);
            }
        }
    }

    planCandidates.sort((a, b) => {
        if (a.isFocused) return -1;
        if (b.isFocused) return 1;
        const aTime = a.assignedDate || a.dueDate || Infinity;
        const bTime = b.assignedDate || b.dueDate || Infinity;
        if (aTime !== bTime) return aTime - bTime;
        const energyMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
        const energyDiff = (energyMap[b.energy] || 2) - (energyMap[a.energy] || 2);
        if (energyDiff !== 0) return energyDiff;
        return (a.createdAt || 0) - (b.createdAt || 0);
    });

    const planIds = new Set(planCandidates.map(t => t.id));
    const overdue = activeTasks.filter(task => {
        if (planIds.has(task.id)) return false;
        if (isBlocked(task, activeTasks)) return false;
        return task.dueDate && task.dueDate < startOfToday;
    }).sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));

    return {
        suggestedPlan: planCandidates,
        overdueTasks: overdue,
        completedCount: completedTasks.length
    };
  }, [activeTasks, completedTasks, recommendation]);

  /**
   * Retrieves the most recent focus intention log for the current day.
   */
  const latestFocus = useMemo(() => {
    const startOfDay = getStartOfDay();
    const todaysFocus = vitals
        .filter(v => v.type === 'focus' && v.timestamp >= startOfDay)
        .sort((a, b) => b.timestamp - a.timestamp);
    return todaysFocus.length > 0 ? (todaysFocus[0].value as string) : '';
  }, [vitals]);

  /**
   * Saves a manual mood check-in and updates the user's energy profile.
   */
  const saveMood = async (level: number) => {
    if (!uid) return;
    const context = await contextApi.getSnapshot();
    const id = crypto.randomUUID();
    const energyMap = [0, 20, 40, 60, 80, 100];
    const energyValue = energyMap[level] || 60;

    await setDoc(doc(db, 'users', uid, 'vitals', id), {
      id,
      timestamp: Date.now(),
      type: 'mood',
      value: energyValue,
      context,
      metadata: { source: 'manual_checkin', moodIndex: level }
    });
  };

  /**
   * Saves a daily focus intention.
   */
  const saveFocus = async (text: string) => {
    if (!uid) return;
    const context = await contextApi.getSnapshot();
    const id = crypto.randomUUID();
    await setDoc(doc(db, 'users', uid, 'vitals', id), {
      id,
      timestamp: Date.now(),
      type: 'focus',
      value: text,
      context
    });
  };

  /**
   * Finalizes a task from the dashboard.
   * Calculates the biological impact (energy drain) and logs the completion
   * to both the Task Database and the Learning Engine.
   *
   * @param task - The task being completed.
   */
  const completeTask = async (task: TaskEntity): Promise<number | null> => {
      const durationSeconds = task.duration * 60;
      const delta = calculateSessionImpact(durationSeconds, durationSeconds, 'Neutral');
      const newEnergy = Math.max(0, Math.min(100, energyModel.currentEnergy + delta));
      
      const nextDate = await taskService.completeTask(task, durationSeconds, activeTasks);
      await taskService.logSessionCompletion(task, 'Neutral', 'Quick Complete', newEnergy);

      try {
           // contextService consolidated
          const userContext = await contextApi.getSnapshot();

          const completionContext: SuggestionContext = {
              currentTime: new Date(),
              energy: energyModel.currentEnergy,
              availableMinutes: 60,
              tasks: activeTasks.filter(t => t.id !== task.id), 
              tags: tags,
              completedTasks: completedTasks,
              backlogCount: activeTasks.length - 1,
              previousPatterns: [],
              userContext: userContext,
          };
          await RecommendationEngine.getInstance().logOrganicSelection(task, completionContext);
      } catch (e) {
          console.error("Failed to log organic selection:", e);
      }

      return nextDate;
  };
  
  return {
    state: {
      suggestedPlan,
      overdueTasks,
      activeTasks: activeTasks,
      taskCount: activeTasks.length,
      latestMood: energyModel.moodIndex,
      latestEnergy: energyModel.currentEnergy,
      latestFocus,
      hasMoodEntry: energyModel.hasEntry,
      tags,
      recommendation
    },
    actions: {
      saveMood,
      saveFocus,
      completeTask,
      updateTask: (taskId: string, updates: Partial<TaskEntity>) => taskService.updateTask(taskId, updates),
      deleteTask: (taskId: string) => taskService.deleteTask(taskId),
      isTaskInActiveSession: (id: string) => activeTasks.find(t => t.id === id)?.isFocused || false
    }
  };
};
