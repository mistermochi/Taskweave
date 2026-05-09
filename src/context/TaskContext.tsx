'use client';

import React, { createContext, useContext, useMemo, useRef, PropsWithChildren } from 'react';
import { where } from 'firebase/firestore';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { Task } from '@/entities/task';

/**
 * Interface for the Task Database context.
 */
interface TaskContextType {
  /** Array of currently active (non-completed, non-archived) tasks. */
  tasks: Task[];
  /** Lookup map for tasks keyed by their unique ID. */
  tasksMap: Record<string, Task>;
  /** Loading state for the tasks subscription. */
  loading: boolean;
  /** Whether there are local writes that have not yet been synchronized with the server. */
  hasPendingWrites: boolean;
}

const TaskContext = createContext<TaskContextType>({
  tasks: [],
  tasksMap: {},
  loading: true,
  hasPendingWrites: false
});

/**
 * Provider that manages the core task database for the application.
 * It maintains a real-time connection to Firestore and implements
 * performance optimizations to prevent unnecessary re-renders.
 *
 * @logic
 * - Subscribes to the full 'tasks' collection.
 * - Uses a "Stabilization" pattern: It compares incoming tasks with a cached
 *   version via `updatedAt`. If a task hasn't changed, it reuses the
 *   existing object reference, keeping the downstream component tree stable.
 */
export const TaskProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { data: allTasks, loading, hasPendingWrites } = useFirestoreCollection<Task>('tasks');

  /**
   * Local cache for stabilization.
   */
  const prevMapRef = useRef<Record<string, Task>>({});
  const prevTasksRef = useRef<Task[]>([]);
  const prevFinalMapRef = useRef<Record<string, Task>>({});

  const { tasks, tasksMap } = useMemo(() => {
    const newMap: Record<string, Task> = {};
    const newList: Task[] = [];
    const prevMap = prevMapRef.current;

    allTasks.forEach(t => {
      const prev = prevMap[t.id];
      if (prev && prev.updatedAt === t.updatedAt) {
        newMap[t.id] = prev;
      } else {
        newMap[t.id] = t;
      }
      newList.push(newMap[t.id]);
    });

    // Bolt ⚡ Optimization: Collection-level stabilization
    let finalTasks = newList;
    let finalMap = newMap;

    const tasksChanged = newList.length !== prevTasksRef.current.length ||
                        newList.some((t, i) => t !== prevTasksRef.current[i]);

    if (!tasksChanged) {
      finalTasks = prevTasksRef.current;
      finalMap = prevFinalMapRef.current;
    }

    prevMapRef.current = newMap;
    prevTasksRef.current = finalTasks;
    prevFinalMapRef.current = finalMap;

    return { tasks: finalTasks, tasksMap: finalMap };
  }, [allTasks]);

  const value = useMemo(() => ({
    tasks,
    tasksMap,
    loading,
    hasPendingWrites
  }), [tasks, tasksMap, loading, hasPendingWrites]);

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

/**
 * Hook to consume the active task database.
 */
export const useTaskContext = () => useContext(TaskContext);
