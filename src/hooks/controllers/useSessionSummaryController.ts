'use client';

import { useState, useMemo } from 'react';
import { useUserId, useFirestoreDoc } from '@/hooks/useFirestore';
import { TaskService } from '@/services/TaskService';
import { calculateSessionImpact } from '@/utils/energyUtils';
import { useEnergyModel } from '@/hooks/useEnergyModel';
import { TaskEntity } from '@/types';

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
  const { data: task, loading: isLoading } = useFirestoreDoc<TaskEntity>('tasks', taskId);
  const energyModel = useEnergyModel();

  const [mood, setMood] = useState<'Energized' | 'Neutral' | 'Drained'>('Neutral');
  const [notes, setNotes] = useState("");

  const actualTimeSpent = task?.actualDuration ?? (task?.duration ?? 25) * 60;
  const plannedTime = (task?.duration ?? 25) * 60;
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
        await TaskService.getInstance().logSessionCompletion(task, mood, notes, projectedEnergy);
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
