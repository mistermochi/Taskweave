"use client";

import { useEffect, useRef, useState } from 'react';
import { useTaskAppStore } from '../use-task-app';
import { parseHash, stringifyAppState, AppState } from './router';
import { Task } from '@/entities/task';
import { createDefaultTask } from './constants';

export function useHashRouter(tasksMap: Map<string, Task>) {
  const {
    activeView,
    setActiveView,
    taskTab,
    setTaskTab,
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

      if (state.taskTab !== useTaskAppStore.getState().taskTab) {
        setTaskTab(state.taskTab);
      }

      if (state.searchQuery !== useTaskAppStore.getState().searchQuery) {
        setSearchQuery(state.searchQuery);
      }

      const currentSelectedTask = useTaskAppStore.getState().selectedTask;
      const isNewTaskTransition = state.selectedTaskId === 'new' && (
        currentSelectedTask?.id !== 'new' ||
        state.shareTitle || state.shareText || state.shareUrl
      );

      if (state.selectedTaskId !== currentSelectedTask?.id || isNewTaskTransition) {
        if (state.selectedTaskId === 'new') {
          const newTask = createDefaultTask();
          if (state.shareTitle) newTask.title = state.shareTitle;

          let notes = state.shareText || '';
          if (state.shareUrl) {
            notes = notes ? `${notes}\n\n${state.shareUrl}` : state.shareUrl;
          }
          if (notes) newTask.notes = notes;

          setSelectedTask(newTask);

          // Clear share parameters from the URL hash once consumed
          // This prevents re-initialization on subsequent re-renders or state changes.
          const currentState = {
            activeView: state.activeView,
            taskTab: state.taskTab,
            selectedTaskId: 'new',
            searchQuery: state.searchQuery,
          };
          const cleanHash = stringifyAppState(currentState);
          if (window.location.hash !== cleanHash) {
            isInternalUpdate.current = true;
            window.location.hash = cleanHash;
          }
        } else if (state.selectedTaskId) {
          const task = tasksMap.get(state.selectedTaskId);
          if (task) {
            setSelectedTask(task);
          } else if (tasksMap.size > 0) {
            // Tasks are loaded but this ID isn't found
            setSelectedTask(null);
          }
          // If tasksMap.size === 0, we're still loading, so we don't clear selectedTask yet
        } else {
          setSelectedTask(null);
        }
      }

      // We're ready once we've processed the hash at least once AND tasks are loaded (if a task ID was present)
      const shouldWaitTasks = state.selectedTaskId && state.selectedTaskId !== 'new' && tasksMap.size === 0;
      if (!shouldWaitTasks) {
        setIsReady(true);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [tasksMap, setActiveView, setTaskTab, setSelectedTask, setSelectedTagId, setSearchQuery]);

  // Sync from Store to Hash
  useEffect(() => {
    // DO NOT sync back to hash until we have successfully restored the state from hash on initial load
    // This prevents overwriting the URL with default state while tasks are still loading.
    if (!isReady) return;

    const currentState: AppState = {
      activeView,
      taskTab,
      selectedTaskId: selectedTask?.id || null,
      searchQuery,
    };

    const newHash = stringifyAppState(currentState);
    if (window.location.hash !== newHash) {
      isInternalUpdate.current = true;
      window.location.hash = newHash;
    }
  }, [isReady, activeView, taskTab, selectedTask, selectedTagId, searchQuery]);
}
