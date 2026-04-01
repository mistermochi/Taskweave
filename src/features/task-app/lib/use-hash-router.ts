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
  const lastProcessedHash = useRef<string | null>(null);
  const isReadyRef = useRef(isReady);

  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  const selectedTagIdRef = useRef(selectedTagId);
  useEffect(() => {
    selectedTagIdRef.current = selectedTagId;
  }, [selectedTagId]);

  // Bolt ⚡ Optimization: Use refs for the event listener to avoid frequent re-binding
  // and race conditions during rapid state/task updates.
  const tasksMapRef = useRef(tasksMap);
  useEffect(() => {
    tasksMapRef.current = tasksMap;
  }, [tasksMap]);

  // Sync from Hash to Store
  useEffect(() => {
    const syncHashToStore = (hash: string, isFromEvent: boolean) => {
      if (isInternalUpdate.current) {
        isInternalUpdate.current = false;
        lastProcessedHash.current = hash;
        return;
      }

      if (lastProcessedHash.current === hash && isFromEvent) {
        return;
      }

      const state = parseHash(hash);
      const store = useTaskAppStore.getState();
      lastProcessedHash.current = hash;

      // Update basic view state
      if (state.activeView !== store.activeView) setActiveView(state.activeView);
      if (state.taskTab !== store.taskTab) setTaskTab(state.taskTab);
      if (state.searchQuery !== store.searchQuery) setSearchQuery(state.searchQuery);

      const currentSelectedTask = store.selectedTask;
      const targetId = state.selectedTaskId;
      const currentId = currentSelectedTask?.id || null;

      // Handle Task selection sync
      if (targetId === 'new') {
        const isNewTaskTransition = (currentId !== 'new' && (isFromEvent || !isReadyRef.current)) || state.shareTitle || state.shareText || state.shareUrl;
        if (isNewTaskTransition) {
          const newTask = createDefaultTask();
          if (state.shareTitle) newTask.title = state.shareTitle;
          let notes = state.shareText || '';
          if (state.shareUrl) notes = notes ? `${notes}\n\n${state.shareUrl}` : state.shareUrl;
          if (notes) newTask.notes = notes;

          setSelectedTask(newTask);

          // Strip share params from URL
          const cleanHash = stringifyAppState({ ...state, shareTitle: undefined, shareText: undefined, shareUrl: undefined });
          if (window.location.hash !== cleanHash) {
            isInternalUpdate.current = true;
            window.location.hash = cleanHash;
            lastProcessedHash.current = cleanHash;
          }
        }
      } else if (targetId) {
        if (targetId !== currentId) {
          const task = tasksMapRef.current.get(targetId);
          if (task) {
            setSelectedTask(task);
          } else {
            // Janitor: Check if the targetId matches an optimistic task
            // that hasn't made it to the main tasksMap yet.
            const store = useTaskAppStore.getState();
            const optimisticTask = store.optimisticTasks[targetId];

            if (optimisticTask) {
              setSelectedTask(optimisticTask as Task);
            } else if (tasksMapRef.current.size > 0) {
              setSelectedTask(null);
            }
          }
        }
      } else if (currentId) {
        setSelectedTask(null);
      }

      // Mark as ready once we've processed the hash at least once
      const isWaitingForTask = targetId && targetId !== 'new' && !tasksMapRef.current.has(targetId) && tasksMapRef.current.size === 0;
      if (!isWaitingForTask) {
        setIsReady(true);
      }
    };

    const handleHashChange = () => syncHashToStore(window.location.hash, true);
    window.addEventListener('hashchange', handleHashChange);

    // Initial sync
    syncHashToStore(window.location.hash, false);

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setActiveView, setTaskTab, setSelectedTask, setSearchQuery]);

  // Sync from Store to Hash
  useEffect(() => {
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
      lastProcessedHash.current = newHash;
    }
  }, [isReady, activeView, taskTab, selectedTask, searchQuery, selectedTagId]);
}
