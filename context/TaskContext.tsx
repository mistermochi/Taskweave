'use client';

import React, { createContext, useContext, useMemo, useRef, PropsWithChildren } from 'react';
import { where } from 'firebase/firestore';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { TaskEntity } from '@/types';

interface TaskContextType {
  tasks: TaskEntity[];
  tasksMap: Record<string, TaskEntity>;
  loading: boolean;
}

const TaskContext = createContext<TaskContextType>({ tasks: [], tasksMap: {}, loading: true });

export const TaskProvider: React.FC<PropsWithChildren> = ({ children }) => {
  // Now only fetches active tasks
  const { data: activeTasks, loading } = useFirestoreCollection<TaskEntity>('tasks', [where('status', '==', 'active')]);

  const prevMapRef = useRef<Record<string, TaskEntity>>({});

  // The deep memoization logic to stabilize task objects
  const { tasks, tasksMap } = useMemo(() => {
    const newMap: Record<string, TaskEntity> = {};
    const newList: TaskEntity[] = [];
    const prevMap = prevMapRef.current;

    activeTasks.forEach(t => {
      const prev = prevMap[t.id];
      // If the task existed before and its timestamp is the same, reuse the old object
      if (prev && prev.updatedAt === t.updatedAt) {
        newMap[t.id] = prev;
      } else {
        newMap[t.id] = t;
      }
      newList.push(newMap[t.id]);
    });

    prevMapRef.current = newMap;
    return { tasks: newList, tasksMap: newMap };
  }, [activeTasks]);

  const value = useMemo(() => ({
    tasks,
    tasksMap,
    loading
  }), [tasks, tasksMap, loading]);

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTaskContext = () => useContext(TaskContext);
