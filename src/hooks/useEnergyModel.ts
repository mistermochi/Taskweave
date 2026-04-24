import { useMemo } from 'react';
import { useVitalsContext } from '@/context/VitalsContext';
import { normalizeEnergy, getMoodIndexFromEnergy } from '@/shared/lib/energyUtils';
import { getStartOfDay } from '@/shared/lib/timeUtils';

/**
 * Interface representing the calculated energy model for the current day.
 */
export interface EnergyModel {
  /** Current energy level on a 0-100 scale. */
  currentEnergy: number;
  /** Simplified mood index on a 1-5 scale for UI elements. */
  moodIndex: number;
  /** Whether the user has logged any mood/energy today (since 4 AM). */
  hasEntry: boolean;
  /** Timestamp of the most recent energy log. */
  lastUpdated: number;
}

/**
 * Hook that calculates and returns the user's current energy model.
 * It processes raw vitals data from the context to determine today's
 * energy trajectory.
 *
 * @returns The `EnergyModel` object containing normalized energy and mood status.
 */
export const useEnergyModel = (): EnergyModel => {
  const { vitals } = useVitalsContext();

  const model = useMemo(() => {
    const startOfDay = getStartOfDay();

    // Bolt ⚡ Optimization: Use find() for O(1) early exit instead of O(N) filter().
    // Since vitals are already sorted descending, the first match is the latest entry.
    const latestMood = vitals.find(v => v.type === 'mood' && v.timestamp >= startOfDay);

    let currentEnergy = 60; // Default / Fallback
    let moodIndex = 3;
    let hasEntry = false;
    let lastUpdated = 0;

    if (latestMood) {
      currentEnergy = normalizeEnergy(latestMood.value);
      moodIndex = getMoodIndexFromEnergy(currentEnergy);
      hasEntry = true;
      lastUpdated = latestMood.timestamp;
    }

    return {
      currentEnergy,
      moodIndex,
      hasEntry,
      lastUpdated
    };
  }, [vitals]);

  return model;
};
