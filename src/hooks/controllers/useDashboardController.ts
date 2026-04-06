import { useMemo, useState, useEffect } from 'react';
import { db } from '@/shared/api/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useUserId } from '@/hooks/useFirestore';
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
  const { tasks: allTasks } = useTaskContext();

  // Bolt ⚡ Optimization: Single-pass partitioning of active and completed tasks
  // Plus identification of latest completed task for recommendation context.
  const { activeTasks, completedTasks, latestCompletedTask } = useMemo(() => {
    const active: TaskEntity[] = [];
    const completed: TaskEntity[] = [];
    let latest: TaskEntity | undefined;

    allTasks.forEach(t => {
      if (t.status === 'active') {
        active.push(t);
      } else if (t.status === 'completed') {
        completed.push(t);
        if (!latest || (t.completedAt || 0) > (latest.completedAt || 0)) {
          latest = t;
        }
      }
    });
    return { activeTasks: active, completedTasks: completed, latestCompletedTask: latest };
  }, [allTasks]);

  const { vitals } = useVitalsContext();
  const { tags } = useReferenceContext();
  const energyModel = useEnergyModel();

  /** Current AI task recommendation with its reasoning. */
  const [recommendation, setRecommendation] = useState<{ taskId: string; reason: string; } | null>(null);

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
          lastTask: latestCompletedTask, // Bolt ⚡: O(1) resolution in RecommendationEngine
          activeTaskIds: new Set(activeTasks.map(t => t.id)), // Bolt ⚡: O(1) blocking check
          backlogCount: activeTasks.length,
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
  }, [activeTasks, completedTasks, energyModel.currentEnergy, tags, latestCompletedTask]);
  
  /**
   * Complex calculation for the "Today's Plan" section.
   * Partitions tasks based on focus state, assigned dates, and hard deadlines.
   * Injects AI recommendations into the plan if not already present.
   */
  const { suggestedPlan, completedCount } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 86400000;

    // Bolt ⚡: O(1) lookup for active task IDs to avoid O(N^2) in isBlocked
    const activeTaskIds = new Set(activeTasks.map(t => t.id));

    const isBlocked = (task: TaskEntity): boolean => {
      if (!task.blockedBy || task.blockedBy.length === 0) return false;
      return task.blockedBy.some(blockerId => activeTaskIds.has(blockerId));
    };

    let planCandidates = activeTasks.filter(task => {
        if (isBlocked(task)) return false;
        const isAssignedToday = task.assignedDate && task.assignedDate >= startOfToday && task.assignedDate < endOfToday;
        const isDueTodayOrOverdue = task.dueDate && task.dueDate < endOfToday;
        return task.isFocused || isAssignedToday || isDueTodayOrOverdue;
    });

    if (recommendation && recommendation.taskId) {
        const isAlreadyInPlan = planCandidates.some(t => t.id === recommendation.taskId);
        if (!isAlreadyInPlan) {
            const recommendedTask = activeTasks.find(t => t.id === recommendation.taskId);
            if (recommendedTask && !isBlocked(recommendedTask)) {
                planCandidates.push(recommendedTask);
            }
        }
    }

    if (planCandidates.length === 0) {
        const inboxTasks = activeTasks.filter(task => {
            if (isBlocked(task)) return false;
            const isAssignedToday = task.assignedDate && task.assignedDate >= startOfToday && task.assignedDate < endOfToday;
            const isDueTodayOrOverdue = task.dueDate && task.dueDate < endOfToday;
            return !isAssignedToday && !isDueTodayOrOverdue;
        });

        if (inboxTasks.length > 0) {
            // Bolt ⚡ Optimization: O(N) search for best inbox task instead of O(N log N) sort
            const bestInboxTask = inboxTasks.reduce((best, curr) => {
                const durationDiff = curr.duration - best.duration;
                if (durationDiff < 0) return curr;
                if (durationDiff > 0) return best;
                // Tie-breaker: newest task first
                return curr.createdAt > best.createdAt ? curr : best;
            });

            if (bestInboxTask) {
                planCandidates.push(bestInboxTask);
            }
        }
    }

    // Bolt ⚡: Hoist map to avoid redundant object creation during sort
    const energyMap = { 'High': 3, 'Medium': 2, 'Low': 1 };

    planCandidates.sort((a, b) => {
        // 1. Focused tasks always first
        if (a.isFocused && !b.isFocused) return -1;
        if (!a.isFocused && b.isFocused) return 1;

        // 2. Overdue tasks next
        const isAOverdue = a.dueDate && a.dueDate < startOfToday;
        const isBOverdue = b.dueDate && b.dueDate < startOfToday;
        if (isAOverdue && !isBOverdue) return -1;
        if (!isAOverdue && isBOverdue) return 1;

        // 3. Due today/Assigned today
        const aTime = a.assignedDate || a.dueDate || Infinity;
        const bTime = b.assignedDate || b.dueDate || Infinity;
        if (aTime !== bTime) return aTime - bTime;

        // 4. Energy requirement
        const energyDiff = (energyMap[b.energy] || 2) - (energyMap[a.energy] || 2);
        if (energyDiff !== 0) return energyDiff;

        // 5. Creation date
        return (a.createdAt || 0) - (b.createdAt || 0);
    });

    return {
        suggestedPlan: planCandidates,
        completedCount: completedTasks.length
    };
  }, [activeTasks, completedTasks, recommendation]);

  /**
   * Retrieves the most recent focus intention log for the current day.
   */
  const latestFocus = useMemo(() => {
    const startOfDay = getStartOfDay();
    // Bolt ⚡ Optimization: Remove redundant sort as VitalsContext already provides data sorted desc
    const todaysFocus = vitals
        .filter(v => v.type === 'focus' && v.timestamp >= startOfDay);
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
      
      const nextDate = await taskApi.completeTask(task, durationSeconds, activeTasks);
      await taskApi.logSessionCompletion(task, 'Neutral', 'Quick Complete', newEnergy);

      try {
           // contextService consolidated
          const userContext = await contextApi.getSnapshot();

          const remainingTasks = activeTasks.filter(t => t.id !== task.id);
          const completionContext: SuggestionContext = {
              currentTime: new Date(),
              energy: energyModel.currentEnergy,
              availableMinutes: 60,
              tasks: remainingTasks,
              tags: tags,
              completedTasks: completedTasks,
              lastTask: task, // The task just completed is the last task
              activeTaskIds: new Set(remainingTasks.map(t => t.id)),
              backlogCount: remainingTasks.length,
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
      updateTask: (taskId: string, updates: Partial<TaskEntity>) => taskApi.updateTask(taskId, updates),
      createTask: (title: string, overrides?: Partial<TaskEntity>) => taskApi.addTask(
          title,
          overrides?.category || '',
          overrides?.duration || 30,
          overrides?.energy === 'High' ? 80 : overrides?.energy === 'Low' ? 25 : 50,
          overrides?.notes || '',
          overrides?.dueDate,
          overrides?.assignedDate,
          overrides?.recurrence
      ),
      deleteTask: (taskId: string) => taskApi.deleteTask(taskId),
      isTaskInActiveSession: (id: string) => activeTasks.find(t => t.id === id)?.isFocused || false
    }
  };
};
