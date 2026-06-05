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
import { Task } from '@/entities/task';
import { calculateSessionImpact } from '@/shared/lib/energyUtils';
import { SuggestionContext } from '@/types/scheduling';
import { RecommendationEngine } from '@/services/RecommendationEngine';

/**
 * View Controller for the main Dashboard interface.
 * Orchestrates task planning, AI recommendations, and energy tracking for the user's "Today" view.
 *
 * @returns State (plans, recommendations, energy levels) and Actions (save mood, complete task).
 */
const ENERGY_MAP = { 'High': 3, 'Medium': 2, 'Low': 1 };
const MOOD_ENERGY_MAP = [0, 20, 40, 60, 80, 100];

export const useDashboardController = () => {
  const uid = useUserId();
  const { tasks: allTasks } = useTaskContext();

  // Bolt ⚡ Optimization: Single-pass partitioning of active and completed tasks
  // Plus identification of latest completed task and active ID set for recommendation context.
  const { activeTasks, activeTaskIds, completedTasks, latestCompletedTask } = useMemo(() => {
    const active: Task[] = [];
    const ids = new Set<string>();
    const completed: Task[] = [];
    let latest: Task | undefined;

    allTasks.forEach(t => {
      if (t.status === 'active') {
        active.push(t);
        ids.add(t.id);
      } else if (t.status === 'completed') {
        completed.push(t);
        if (!latest || (t.completedAt || 0) > (latest.completedAt || 0)) {
          latest = t;
        }
      }
    });
    return { activeTasks: active, activeTaskIds: ids, completedTasks: completed, latestCompletedTask: latest };
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
        const context: SuggestionContext = {
          currentTime: new Date(),
          energy: energyModel.currentEnergy, 
          tasks: activeTasks,
          tags: tags, 
          completedTasks: completedTasks,
          lastTask: latestCompletedTask, // Bolt ⚡: O(1) resolution in RecommendationEngine
          activeTaskIds: activeTaskIds, // Bolt ⚡: Reuse stable O(1) lookup set
        };
        const result = await engine.generateSuggestion(context);
        if (result.suggestion && result.suggestion.type === 'task' && result.suggestion.taskId) {
            setRecommendation({ taskId: result.suggestion.taskId, reason: result.suggestion.reason });
        } else {
            setRecommendation(null);
        }
      } catch {
        // Fallback: recommendation calculation failure is non-critical for dashboard
      }
    };
    calculateRecommendation();
  }, [activeTasks, completedTasks, energyModel.currentEnergy, tags, latestCompletedTask, activeTaskIds]);
  
  /**
   * Complex calculation for the "Today's Plan" section.
   * Partitions tasks based on focus state, assigned dates, and hard deadlines.
   * Injects AI recommendations into the plan if not already present.
   */
  const { suggestedPlan } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 86400000;

    const isBlocked = (task: Task): boolean => {
      if (!task.blockedBy || task.blockedBy.length === 0) return false;
      return task.blockedBy.some(blockerId => activeTaskIds.has(blockerId));
    };

    // Bolt ⚡ Optimization: Single O(N) pass to partition plan candidates and inbox tasks
    const planCandidates: Task[] = [];
    const inboxTasks: Task[] = [];

    activeTasks.forEach(task => {
        if (isBlocked(task)) return;

        const isAssignedToday = task.assignedDate && task.assignedDate >= startOfToday && task.assignedDate < endOfToday;
        const isDueTodayOrOverdue = task.dueDate && task.dueDate < endOfToday;

        if (task.isFocused || isAssignedToday || isDueTodayOrOverdue) {
            planCandidates.push(task);
        } else {
            inboxTasks.push(task);
        }
    });

    if (recommendation && recommendation.taskId) {
        const isAlreadyInPlan = planCandidates.some(t => t.id === recommendation.taskId);
        if (!isAlreadyInPlan) {
            // Bolt ⚡: O(1) lookup for recommendation from mergedTasksMap would be faster,
            // but we only have activeTasks array here. Still, it's just one find.
            const recommendedTask = activeTasks.find(t => t.id === recommendation.taskId);
            if (recommendedTask && !isBlocked(recommendedTask)) {
                planCandidates.push(recommendedTask);
            }
        }
    }

    if (planCandidates.length === 0 && inboxTasks.length > 0) {
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
        const energyDiff = (ENERGY_MAP[b.energy] || 2) - (ENERGY_MAP[a.energy] || 2);
        if (energyDiff !== 0) return energyDiff;

        // 5. Creation date
        return (a.createdAt || 0) - (b.createdAt || 0);
    });

    return {
        suggestedPlan: planCandidates
    };
  }, [activeTasks, recommendation, activeTaskIds]);

  /**
   * Retrieves the most recent focus intention log for the current day.
   */
  const latestFocus = useMemo(() => {
    const startOfDay = getStartOfDay();
    // Bolt ⚡ Optimization: Use find() instead of filter() to avoid O(N) array allocation
    const latest = vitals
        .find(v => v.type === 'focus' && v.timestamp >= startOfDay);
    return latest ? (latest.value as string) : '';
  }, [vitals]);

  /**
   * Saves a manual mood check-in and updates the user's energy profile.
   */
  const saveMood = async (level: number) => {
    if (!uid) return;
    const context = await contextApi.getSnapshot();
    const id = crypto.randomUUID();
    const energyValue = MOOD_ENERGY_MAP[level] || 60;

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
  const completeTask = async (task: Task): Promise<number | null> => {
      const durationSeconds = task.duration * 60;
      const delta = calculateSessionImpact(durationSeconds, durationSeconds, 'Neutral');
      const newEnergy = Math.max(0, Math.min(100, energyModel.currentEnergy + delta));
      
      const nextDate = await taskApi.completeTask(task, durationSeconds, activeTasks);
      await taskApi.logSessionCompletion(task, 'Neutral', 'Quick Complete', newEnergy);

      try {
          const remainingTasks = activeTasks.filter(t => t.id !== task.id);
          const completionContext: SuggestionContext = {
              currentTime: new Date(),
              energy: energyModel.currentEnergy,
              tasks: remainingTasks,
              tags: tags,
              completedTasks: completedTasks,
              lastTask: task, // The task just completed is the last task
              activeTaskIds: new Set(remainingTasks.map(t => t.id)),
          };
          await RecommendationEngine.getInstance().logOrganicSelection(task, completionContext);
      } catch {
          // Fallback: logging organic selection failure is non-critical
      }

      return nextDate;
  };
  
  return {
    state: {
      suggestedPlan,
      activeTasks: activeTasks,
      latestMood: energyModel.moodIndex,
      latestEnergy: energyModel.currentEnergy,
      latestFocus,
      tags,
      recommendation
    },
    actions: {
      saveMood,
      saveFocus,
      completeTask,
      updateTask: (taskId: string, updates: Partial<Task>) => taskApi.updateTask(taskId, updates),
      createTask: (title: string, overrides?: Partial<Task>) => taskApi.addTask(
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
