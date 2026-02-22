
'use client';

import { useState, useMemo } from 'react';
import { useUserId, useFirestoreDoc } from '@/hooks/useFirestore';
import { TaskService } from '@/services/TaskService';
import { calculateSessionImpact } from '@/utils/energyUtils';
import { useEnergyModel } from '@/hooks/useEnergyModel';
import { TaskEntity } from '@/types';

export const useSessionSummaryController = (taskId: string | undefined) => {
  const uid = useUserId();
  const { data: task, loading: isLoading } = useFirestoreDoc<TaskEntity>('tasks', taskId);
  const energyModel = useEnergyModel();

  const [mood, setMood] = useState<'Energized' | 'Neutral' | 'Drained'>('Neutral');
  const [notes, setNotes] = useState("");

  // Calculate actual time spent
  const actualTimeSpent = task?.actualDuration ?? (task?.duration ?? 25) * 60;
  const plannedTime = (task?.duration ?? 25) * 60;
  const timeDifference = actualTimeSpent - plannedTime;
  
  const currentEnergy = energyModel.currentEnergy;

  // Calculate Impact
  const energyDelta = useMemo(() => {
    return calculateSessionImpact(actualTimeSpent, plannedTime, mood);
  }, [mood, actualTimeSpent, plannedTime]);

  const projectedEnergy = Math.max(0, Math.min(100, currentEnergy + energyDelta));

  const formatTimeSpent = (seconds: number) => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    if (mins === 0) return "< 1m";
    return `${mins}m`;
  };

  const getTimeChipText = () => {
    return formatTimeSpent(actualTimeSpent);
  };

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

