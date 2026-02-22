

import { useMemo, useState, useEffect } from 'react';
import { db } from '@/firebase';
import { doc, setDoc, where } from 'firebase/firestore';
import { useUserId, useFirestoreCollection } from '@/hooks/useFirestore';
import { ContextService } from "@/services/ContextService";
import { useTaskContext } from '@/context/TaskContext';
import { useVitalsContext } from '@/context/VitalsContext';
import { useReferenceContext } from '@/context/ReferenceContext';
import { useEnergyModel } from '@/hooks/useEnergyModel';
import { getStartOfDay } from '@/utils/timeUtils';
import { TaskService } from '@/services/TaskService';
import { TaskEntity } from '@/types';
import { calculateSessionImpact } from '@/utils/energyUtils';
import { SuggestionContext } from '@/types/scheduling';
import { RecommendationEngine } from '@/services/RecommendationEngine';

export const useDashboardController = () => {
  const uid = useUserId();
  const { tasks: activeTasks } = useTaskContext(); // This is now guaranteed to be only active tasks
  const { vitals } = useVitalsContext();
  const { tags } = useReferenceContext();
  const energyModel = useEnergyModel();
  const taskService = TaskService.getInstance();
  const [recommendation, setRecommendation] = useState<{ taskId: string; reason: string; } | null>(null);

  // New: Fetch completed tasks specifically for this controller
  const { data: completedTasks } = useFirestoreCollection<TaskEntity>('tasks', [where('status', '==', 'completed')]);

  useEffect(() => {
    if (activeTasks.length === 0) {
      setRecommendation(null);
      return;
    }
    const calculateRecommendation = async () => {
      try {
        const engine = RecommendationEngine.getInstance();
        const contextService = ContextService.getInstance();
        const userContext = await contextService.getSnapshot();
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
  
  // -- New "Suggest a Plan" Logic --
  const { suggestedPlan, overdueTasks, completedCount } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 86400000;

    const isBlocked = (task: TaskEntity, tasks: TaskEntity[]): boolean => {
      if (!task.blockedBy || task.blockedBy.length === 0) return false;
      return task.blockedBy.some(blockerId => tasks.some(t => t.id === blockerId));
    };
    
    // 1. GATHER all tasks for today's plan: focused, assigned for today, or due today/overdue
    let planCandidates = activeTasks.filter(task => {
        if (isBlocked(task, activeTasks)) return false;

        const isAssignedToday = task.assignedDate && task.assignedDate >= startOfToday && task.assignedDate < endOfToday;
        const isDueTodayOrOverdue = task.dueDate && task.dueDate < endOfToday;
        
        return task.isFocused || isAssignedToday || isDueTodayOrOverdue;
    });

    // --- NEW: Inject AI recommendation from Inbox ---
    if (recommendation && recommendation.taskId) {
        const isAlreadyInPlan = planCandidates.some(t => t.id === recommendation.taskId);
        if (!isAlreadyInPlan) {
            const recommendedTask = activeTasks.find(t => t.id === recommendation.taskId);
            // Ensure the recommended task is not blocked
            if (recommendedTask && !isBlocked(recommendedTask, activeTasks)) {
                planCandidates.push(recommendedTask);
            }
        }
    }

    // --- NEW PROACTIVE SUGGESTION LOGIC ---
    // If the plan is STILL empty, find a good candidate from the inbox.
    if (planCandidates.length === 0) {
        const inboxTasks = activeTasks.filter(task => {
            if (isBlocked(task, activeTasks)) return false;
            // A task is in the inbox if it's not scheduled for today or overdue
            const isScheduledOrOverdue = (task.assignedDate && task.assignedDate >= startOfToday && task.assignedDate < endOfToday) || (task.dueDate && task.dueDate < endOfToday);
            return !isScheduledOrOverdue;
        });

        if (inboxTasks.length > 0) {
            // Find the best candidate: shortest duration, then newest.
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

    // 2. SORT the plan chronologically and by priority
    planCandidates.sort((a, b) => {
        if (a.isFocused) return -1;
        if (b.isFocused) return 1;

        // Use assignedDate for user-planned items, fallback to dueDate for deadlines/events
        const aTime = a.assignedDate || a.dueDate || Infinity;
        const bTime = b.assignedDate || b.dueDate || Infinity;
        
        if (aTime !== bTime) {
            return aTime - bTime;
        }

        // Fallback for items with identical times: higher energy first
        const energyMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
        const energyDiff = (energyMap[b.energy] || 2) - (energyMap[a.energy] || 2);
        if (energyDiff !== 0) {
            return energyDiff;
        }

        return (a.createdAt || 0) - (b.createdAt || 0); // oldest first as final tie-breaker
    });

    // 3. IDENTIFY Overdue tasks that are NOT part of today's plan
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

  // -- Legacy Focus Intention --
  const latestFocus = useMemo(() => {
    const startOfDay = getStartOfDay();
    const todaysFocus = vitals
        .filter(v => v.type === 'focus' && v.timestamp >= startOfDay)
        .sort((a, b) => b.timestamp - a.timestamp);
    return todaysFocus.length > 0 ? (todaysFocus[0].value as string) : '';
  }, [vitals]);

  // Actions
  const saveMood = async (level: number) => {
    if (!uid) return;
    const context = await ContextService.getInstance().getSnapshot();
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

  const saveFocus = async (text: string) => {
    if (!uid) return;
    const context = await ContextService.getInstance().getSnapshot();
    const id = crypto.randomUUID();
    await setDoc(doc(db, 'users', uid, 'vitals', id), {
      id,
      timestamp: Date.now(),
      type: 'focus',
      value: text,
      context
    });
  };

  const completeTask = async (task: TaskEntity): Promise<number | null> => {
      const durationSeconds = task.duration * 60;
      // Assume Neutral mood for quick completes
      const delta = calculateSessionImpact(durationSeconds, durationSeconds, 'Neutral');
      const newEnergy = Math.max(0, Math.min(100, energyModel.currentEnergy + delta));
      
      const nextDate = await taskService.completeTask(task, durationSeconds, activeTasks);
      await taskService.logSessionCompletion(task, 'Neutral', 'Quick Complete', newEnergy);

      // --- NEW LEARNING LOGIC ---
      try {
          const contextService = ContextService.getInstance();
          const userContext = await contextService.getSnapshot();

          // Construct the context at the moment of completion
          const completionContext: SuggestionContext = {
              currentTime: new Date(),
              energy: energyModel.currentEnergy,
              availableMinutes: 60,
              // The state of the world *before* this task was completed
              tasks: activeTasks.filter(t => t.id !== task.id), 
              tags: tags,
              completedTasks: completedTasks,
              backlogCount: activeTasks.length - 1,
              previousPatterns: [],
              userContext: userContext,
          };
          // Log this organic choice to the learning engine
          await RecommendationEngine.getInstance().logOrganicSelection(task, completionContext);
      } catch (e) {
          console.error("Failed to log organic selection:", e);
      }
      // --- END NEW LEARNING LOGIC ---

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
