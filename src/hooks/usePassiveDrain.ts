import { useEffect, useState } from 'react';
import { useVitalsContext } from '@/context/VitalsContext';
import { useUserId } from '@/hooks/useFirestore';
import { db } from '@/shared/api/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { calculatePassiveDrain, normalizeEnergy } from '@/shared/lib/energyUtils';
import { getStartOfDay } from '@/shared/lib/timeUtils';

/**
 * Hook that manages the simulation of "biological battery drain" when the user is inactive.
 * It runs once upon application load/auth and calculates how much energy has been lost
 * since the last app usage or the daily reset (4:00 AM).
 *
 * @interaction
 * - On first run, checks if the last mood log was from a previous day.
 * - If it's a new day, it performs a "Daily Reset" (starting from 100% energy at 4:00 AM).
 * - If it's the same day, it applies the hourly passive drain rate.
 * - Persists the calculated energy level back to Firestore as a new vital entry.
 */
export const usePassiveDrain = () => {
  const { vitals, loading } = useVitalsContext();
  const uid = useUserId();
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    // Only run once when data is loaded and user is authenticated
    if (loading || !uid || hasProcessed) return;

    const processDrain = async () => {
      // Find latest mood/energy entry
      const moodVitals = vitals
        .filter(v => v.type === 'mood')
        .sort((a, b) => b.timestamp - a.timestamp);

      // Determine "Start of Today" (4 AM)
      const now = Date.now();
      const startOfToday = getStartOfDay(now);

      // Case 0: No data ever.
      if (moodVitals.length === 0) {
        setHasProcessed(true);
        return;
      }

      const latestVital = moodVitals[0];

      // Case 1: Daily Reset (Last log was before 4 AM today)
      if (latestVital.timestamp < startOfToday) {
         const baseEnergy = 100;
         const drainAmount = calculatePassiveDrain(startOfToday, now);
         const netEnergy = Math.max(0, baseEnergy - drainAmount);
         const hoursSinceReset = (now - startOfToday) / (1000 * 60 * 60);

         const vitalId = crypto.randomUUID();
         try {
           await setDoc(doc(db, 'users', uid, 'vitals', vitalId), {
             id: vitalId,
             timestamp: now,
             type: 'mood',
             value: netEnergy, 
             metadata: {
               source: 'daily_reset',
               baseEnergy: 100,
               drainAfterReset: drainAmount,
               hoursSince4AM: hoursSinceReset,
               previousValue: latestVital.value,
               resetTime: new Date(startOfToday).toISOString()
             }
           });
         } catch (e) {
           console.error("Failed to process daily reset", e);
         }
         setHasProcessed(true);
         return;
      }

      // Case 2: Same Day Passive Drain
      const drainAmount = calculatePassiveDrain(latestVital.timestamp, now);

      if (drainAmount > 0) {
        const currentEnergy = normalizeEnergy(latestVital.value);
        const newEnergy = Math.max(0, currentEnergy - drainAmount);
        
        const vitalId = crypto.randomUUID();
        try {
          await setDoc(doc(db, 'users', uid, 'vitals', vitalId), {
            id: vitalId,
            timestamp: now,
            type: 'mood',
            value: newEnergy,
            metadata: {
              source: 'passive_drain',
              drainAmount: drainAmount,
              hoursSinceLast: (now - latestVital.timestamp) / (1000 * 60 * 60)
            }
          });
        } catch (e) {
          console.error("Failed to apply passive drain", e);
        }
      }
      setHasProcessed(true);
    };

    processDrain();
  }, [vitals, loading, uid, hasProcessed]);
};
