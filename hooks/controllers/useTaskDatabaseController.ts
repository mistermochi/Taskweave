import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTaskContext } from '@/context/TaskContext';
import { useReferenceContext } from '@/context/ReferenceContext';
import { TaskEntity, Category, Tag } from "@/types";
import { RecommendationEngine } from '@/services/RecommendationEngine';
import { LinUCBService } from '@/services/LinUCBService';
import { ContextService } from '@/services/ContextService';
import { SuggestionContext } from '@/types/scheduling';
import { TaskService } from '@/services/TaskService';
import { useUserId, useFirestoreCollection } from '@/hooks/useFirestore';
import { useEnergyModel } from '@/hooks/useEnergyModel';
import { calculateSessionImpact } from '@/utils/energyUtils';
import { getNextRecurrenceDate } from '@/utils/timeUtils';
import { where } from 'firebase/firestore';

/**
 * View Controller for the Task Inventory (Database) interface.
 * Handles the high-level logic for searching, filtering by tag hierarchies,
 * grouping tasks into temporal sections (Overdue, Today, Upcoming, Inbox),
 * and processing AI-driven task recommendations within the list.
 *
 * @param activeTagFilter - The ID of the currently selected tag for filtering.
 * @returns State (grouped tasks, search state, recommendation) and Actions (CRUD operations, scheduling).
 */
export const useTaskDatabaseController = (activeTagFilter: string | null) => {
  const uid = useUserId();
  const { tasks: allActiveTasks } = useTaskContext();
  const { tags } = useReferenceContext();
  const energyModel = useEnergyModel();
  
  const [searchQuery, setSearchQuery] = useState("");
  /** Current AI-driven recommendation for the "Best Next Task" in the inventory. */
  const [recommendation, setRecommendation] = useState<{ taskId: string; reason: string; strategy: string } | null>(null);
  
  const { data: completedTasks } = useFirestoreCollection<TaskEntity>('tasks', [where('status', '==', 'completed')]);
  const taskService = TaskService.getInstance();

  /**
   * Initializes the machine learning engine with the current user's ID.
   */
  useEffect(() => {
    if (uid) LinUCBService.getInstance().setUserId(uid);
  }, [uid]);

  /**
   * Recalculates the recommended task whenever the task list or user energy changes.
   */
  useEffect(() => {
    if (allActiveTasks.length === 0) {
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
          tasks: allActiveTasks,
          tags: tags, 
          completedTasks: completedTasks,
          backlogCount: allActiveTasks.length,
          previousPatterns: [],
          userContext
        };
        const result = await engine.generateSuggestion(context);
        if (result.suggestion && result.suggestion.type === 'task') {
            const targetId = result.suggestion.taskId;
            if (targetId) {
                setRecommendation({ taskId: targetId, reason: result.suggestion.reason, strategy: result.strategy });
            }
        } else {
            setRecommendation(null);
        }
      } catch (e) {
        console.error("Failed to calculate recommendation", e);
      }
    };
    calculateRecommendation();
  }, [allActiveTasks, completedTasks, uid, energyModel.currentEnergy, tags]);

  /**
   * Recursive helper to find all child and descendant tag IDs.
   * Enables "cascading" filters where selecting a parent tag shows tasks from all sub-tags.
   */
  const getDescendantTagIds = useCallback((rootId: string, allTags: Tag[]): Set<string> => {
      const descendants = new Set<string>();
      descendants.add(rootId);
      
      const findChildren = (parentId: string) => {
          const children = allTags.filter(t => t.parentId === parentId);
          children.forEach(c => {
              descendants.add(c.id);
              findChildren(c.id);
          });
      };
      
      findChildren(rootId);
      return descendants;
  }, []);

  /**
   * Filters tasks based on search query and active tag (including sub-tags).
   */
  const filteredTasks = useMemo(() => {
      return allActiveTasks.filter(t => {
          if (searchQuery) {
            const lowerCaseQuery = searchQuery.toLowerCase();
            const titleMatch = t.title.toLowerCase().includes(lowerCaseQuery);
            const notesMatch = t.notes ? t.notes.toLowerCase().includes(lowerCaseQuery) : false;
            if (!titleMatch && !notesMatch) return false;
          }

          if (activeTagFilter) {
              const allowedTags = getDescendantTagIds(activeTagFilter, tags);
              return allowedTags.has(t.category);
          }
          return true;
      });
  }, [allActiveTasks, searchQuery, activeTagFilter, tags, getDescendantTagIds]);

  /**
   * Partitions the filtered tasks into logical UI sections based on dates and status.
   */
  const sections = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 86400000;
    const twoWeeksFromNow = now.getTime() + (14 * 24 * 60 * 60 * 1000);

    const tempSections: {
        overdue: TaskEntity[];
        today: TaskEntity[];
        upcoming: TaskEntity[];
        inbox: TaskEntity[];
    } = { overdue: [], today: [], upcoming: [], inbox: [] };

    for (const task of filteredTasks) {
        if (task.isFocused || (task.assignedDate && task.assignedDate >= startOfToday && task.assignedDate < endOfToday)) {
            tempSections.today.push(task);
        } else if (task.dueDate && task.dueDate < endOfToday) {
            tempSections.overdue.push(task);
        } else if ((task.assignedDate && task.assignedDate >= endOfToday) || (task.dueDate && task.dueDate >= endOfToday && task.dueDate <= twoWeeksFromNow)) {
            tempSections.upcoming.push(task);
        } else {
            tempSections.inbox.push(task);
        }
    }
    
    tempSections.overdue.sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
    tempSections.today.sort((a, b) => ((b.isFocused ? 1 : 0) - (a.isFocused ? 1 : 0)) || ((a.assignedDate || 0) - (b.assignedDate || 0)));
    tempSections.upcoming.sort((a, b) => (a.assignedDate || a.dueDate || 0) - (b.assignedDate || b.dueDate || 0));
    
    tempSections.inbox.sort((a, b) => {
        const isARecommended = recommendation?.taskId === a.id;
        const isBRecommended = recommendation?.taskId === b.id;
        if (isARecommended) return -1;
        if (isBRecommended) return 1;

        const aHasDue = !!a.dueDate;
        const bHasDue = !!b.dueDate;
        if (aHasDue && !bHasDue) return -1;
        if (!aHasDue && bHasDue) return 1;
        if (aHasDue && bHasDue) {
            const dueDateDiff = (a.dueDate || 0) - (b.dueDate || 0);
            if (dueDateDiff !== 0) return dueDateDiff;
        }

        const durationDiff = a.duration - b.duration;
        if (durationDiff !== 0) return durationDiff;

        return b.createdAt - a.createdAt;
    });

    return tempSections;

  }, [filteredTasks, recommendation]);

  const actions = useMemo(() => {
      return {
          setSearchQuery,
          
          /**
           * Rejects the AI recommendation and logs the negative feedback to the learning engine.
           */
          rejectRecommendation: async () => {
            if (!uid || !recommendation) return;

            const contextService = ContextService.getInstance();
            const userContext = await contextService.getSnapshot();
            
            const context: SuggestionContext = {
              currentTime: new Date(),
              energy: energyModel.currentEnergy, 
              availableMinutes: 60,
              tasks: allActiveTasks,
              tags: tags, 
              completedTasks: completedTasks,
              backlogCount: allActiveTasks.length,
              previousPatterns: [],
              userContext
            };

            await RecommendationEngine.getInstance().logRejection(context, recommendation.strategy);
            setRecommendation(null);
          },

          /**
           * Completes a task immediately without opening a timer session.
           */
          quickCompleteTask: async (task: TaskEntity): Promise<number | null> => {
            if (!uid) return null;
            const durationSeconds = task.duration * 60;
            const delta = calculateSessionImpact(durationSeconds, durationSeconds, 'Neutral');
            const newEnergy = Math.max(0, Math.min(100, energyModel.currentEnergy + delta));

            const nextDate = await taskService.completeTask(task, durationSeconds, allActiveTasks);
            await taskService.logSessionCompletion(task, 'Neutral', 'Quick Complete', newEnergy);
            return nextDate;
          },
          
          uncompleteTask: (taskId: string) => taskService.uncompleteTask(taskId),

          /**
           * Schedules a task to be performed during the current day.
           */
          scheduleForToday: async (task: TaskEntity) => {
              if (!uid) return;
              const now = new Date();
              const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
              await taskService.updateTask(task.id, { assignedDate: today.getTime() });
          },

          /**
           * Creates a new task with optional metadata overrides.
           */
          createTask: async (title: string, overrides?: Partial<TaskEntity>): Promise<number | null> => {
              if (!uid || !title.trim()) return null;

              let energyValue = 50;
              if (overrides?.energy === 'High') energyValue = 80;
              else if (overrides?.energy === 'Low') energyValue = 25;
              
              await taskService.addTask(
                  title,
                  (overrides?.category as Category) || '', 
                  overrides?.duration || 30,
                  energyValue,
                  overrides?.notes || '', 
                  overrides?.dueDate,
                  overrides?.assignedDate,
                  overrides?.recurrence
              );

              if (overrides?.recurrence) {
                  return getNextRecurrenceDate(overrides.dueDate, overrides.recurrence);
              }
              return null;
          },

          updateTask: (taskId: string, updates: Partial<TaskEntity>) => taskService.updateTask(taskId, updates),
          archiveTask: (taskId: string) => taskService.archiveTask(taskId),
          unarchiveTask: (taskId: string) => taskService.unarchiveTask(taskId),
          deleteTask: (taskId: string) => taskService.deleteTask(taskId),
          isTaskInActiveSession: (id: string) => allActiveTasks.find(t => t.id === id)?.isFocused || false,
          getDescendantTagIds
      };
  }, [uid, getDescendantTagIds, energyModel, allActiveTasks, taskService, recommendation, tags, completedTasks]);

  return {
    state: {
      sections,
      recommendation,
      tags,
      searchQuery
    },
    actions
  };
};
