'use client';

import { useState, useMemo } from 'react';
import { useUserId, useFirestoreDoc } from '@/hooks/useFirestore';
import { taskApi } from '@/entities/task';
import { calculateSessionImpact } from '@/shared/lib/energyUtils';
import { useEnergyModel } from '@/hooks/useEnergyModel';
import { Task } from '@/entities/task';

/**
 * View Controller for the post-task Reflection (Session Summary) interface.
 * Manages the user's feedback on their focus session, including mood and notes,
 * and calculates the resulting impact on their biological energy.
 *
 * @param taskId - ID of the task that was just completed.
 * @returns State (task info, energy projections) and Actions (set mood/notes, finalize).
 */
export const useSessionSummaryController = (taskId: string | undefined) => {
  const uid = useUserId();
  /** Real-time subscription to the specific task being summarized. */
  const { data: task, loading: isLoading } = useFirestoreDoc<Task>('tasks', taskId);
  const energyModel = useEnergyModel();

  const [mood, setMood] = useState<'Energized' | 'Neutral' | 'Drained'>('Neutral');
  const [notes, setNotes] = useState("");

  const plannedTime = (task?.duration ?? 25) * 60;
  // Use actualDuration if task is already completed (which it should be per our new flow)
  // Otherwise, default to planned duration for a missing duration as a safe fallback.
  const actualTimeSpent = task?.actualDuration ?? plannedTime;
  const timeDifference = actualTimeSpent - plannedTime;
  
  const currentEnergy = energyModel.currentEnergy;

  /**
   * Dynamically calculates the energy delta based on time spent and user mood.
   */
  const energyDelta = useMemo(() => {
    return calculateSessionImpact(actualTimeSpent, plannedTime, mood);
  }, [mood, actualTimeSpent, plannedTime]);

  /** The user's new estimated energy level after saving. */
  const projectedEnergy = Math.max(0, Math.min(100, currentEnergy + energyDelta));

  const formatTimeSpent = (seconds: number) => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    if (mins === 0) return "< 1m";
    return `${mins}m`;
  };

  const getTimeChipText = () => {
    return formatTimeSpent(actualTimeSpent);
  };

  /**
   * Finalizes the session by logging mood, notes, and the new energy level to Firestore.
   */
  const finishSession = async () => {
    if (task && uid) {
        await taskApi.logSessionCompletion(task, mood, notes, projectedEnergy);
    }
  };

  return {
    state: {
      task,
      mood,
      notes,
      isLoading,
      actualTimeSpent,
      timeDifference,
      getTimeChipText,
      formatTimeSpent,
      energyDelta,
      projectedEnergy,
      currentEnergy
    },
    actions: {
      setMood,
      setNotes,
      finishSession
    }
  };
};
