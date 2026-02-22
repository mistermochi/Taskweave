
import { useMemo } from 'react';
import { useVitalsContext } from '@/context/VitalsContext';
import { normalizeEnergy, getMoodIndexFromEnergy } from '@/utils/energyUtils';
import { getStartOfDay } from '@/utils/timeUtils';

export interface EnergyModel {
  currentEnergy: number; // 0-100
  moodIndex: number;     // 1-5
  hasEntry: boolean;     // True if there is a log since 4 AM
  lastUpdated: number;
}

export const useEnergyModel = (): EnergyModel => {
  // Phase 2: Isolate subscription to only Vitals
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
