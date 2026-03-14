"use client";

import { useEffect, useRef, useState } from 'react';
import { useTaskAppStore } from '../use-task-app';
import { parseHash, stringifyAppState, AppState } from './router';
import { Task } from '@/entities/task';
import { createDefaultTask } from './constants';

export function useHashRouter(tasks: Task[]) {
  const {
    activeView,
    setActiveView,
    selectedTask,
    setSelectedTask,
    selectedTagId,
    setSelectedTagId,
    searchQuery,
    setSearchQuery,
  } = useTaskAppStore();

  const isInternalUpdate = useRef(false);
  const [isReady, setIsReady] = useState(false);

  // Sync from Hash to Store (Initial load & hash changes)
  useEffect(() => {
    const handleHashChange = () => {
      if (isInternalUpdate.current) {
        isInternalUpdate.current = false;
        return;
      }

      const state = parseHash(window.location.hash);

      // Atomic updates if possible, but Zustand setters are already fine
      if (state.activeView !== useTaskAppStore.getState().activeView) {
        setActiveView(state.activeView);
      }

      if (state.selectedTagId !== useTaskAppStore.getState().selectedTagId) {
        setSelectedTagId(state.selectedTagId);
      }

      if (state.searchQuery !== useTaskAppStore.getState().searchQuery) {
        setSearchQuery(state.searchQuery);
      }

      const currentSelectedTask = useTaskAppStore.getState().selectedTask;
      if (state.selectedTaskId !== currentSelectedTask?.id) {
        if (state.selectedTaskId === 'new') {
            setSelectedTask(createDefaultTask());
        } else if (state.selectedTaskId) {
          const task = tasks.find(t => t.id === state.selectedTaskId);
          if (task) {
            setSelectedTask(task);
          } else if (tasks.length > 0) {
            // Tasks are loaded but this ID isn't found
            setSelectedTask(null);
          }
          // If tasks.length === 0, we're still loading, so we don't clear selectedTask yet
        } else {
          setSelectedTask(null);
        }
      }

      // We're ready once we've processed the hash at least once AND tasks are loaded (if a task ID was present)
      const shouldWaitTasks = state.selectedTaskId && state.selectedTaskId !== 'new' && tasks.length === 0;
      if (!shouldWaitTasks) {
        setIsReady(true);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [tasks, setActiveView, setSelectedTask, setSelectedTagId, setSearchQuery]);

  // Sync from Store to Hash
  useEffect(() => {
    // DO NOT sync back to hash until we have successfully restored the state from hash on initial load
    // This prevents overwriting the URL with default state while tasks are still loading.
    if (!isReady) return;

    const currentState: AppState = {
      activeView,
      selectedTaskId: selectedTask?.id || null,
      selectedTagId,
      searchQuery,
    };

    const newHash = stringifyAppState(currentState);
    if (window.location.hash !== newHash) {
      isInternalUpdate.current = true;
      window.location.hash = newHash;
    }
  }, [isReady, activeView, selectedTask, selectedTagId, searchQuery]);
}
