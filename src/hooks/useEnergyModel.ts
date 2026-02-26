import { useMemo } from 'react';
import { useVitalsContext } from '@/context/VitalsContext';
import { normalizeEnergy, getMoodIndexFromEnergy } from '@/utils/energyUtils';
import { getStartOfDay } from '@/utils/timeUtils';

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

    // Filter for today's mood vitals (since 4 AM)
    const todaysVitals = vitals
      .filter(v => v.type === 'mood' && v.timestamp >= startOfDay)
      .sort((a, b) => b.timestamp - a.timestamp);

    let currentEnergy = 60; // Default / Fallback
    let moodIndex = 3;
    let hasEntry = false;
    let lastUpdated = 0;

    if (todaysVitals.length > 0) {
      const latest = todaysVitals[0];
      currentEnergy = normalizeEnergy(latest.value);
      moodIndex = getMoodIndexFromEnergy(currentEnergy);
      hasEntry = true;
      lastUpdated = latest.timestamp;
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
