/**
 * Utility for managing energy-related calculations and conversions.
 * It handles normalization between different scales and manages the "passive drain" logic.
 */

/** The rate at which energy decreases per hour of inactivity. */
export const PASSIVE_DRAIN_RATE_PER_HOUR = 2.5;

/**
 * Converts various inputs (1-5 scale or raw numbers) to a normalized 0-100 range.
 *
 * @param value - The raw energy/mood value to normalize.
 * @returns A normalized value between 0 and 100.
 */
export const normalizeEnergy = (value: number | string): number => {
  const val = Number(value);
  // If <= 5, assume it's the 1-5 mood scale
  if (val <= 5) {
    const map = [0, 20, 40, 60, 80, 100];
    return map[Math.round(val)] || 60;
  }
  return Math.min(100, Math.max(0, val));
};

/**
 * Converts a 0-100 energy score back to a 1-5 scale for UI components.
 *
 * @param energy - The normalized energy value.
 * @returns An integer between 1 and 5.
 */
export const getMoodIndexFromEnergy = (energy: number): number => {
    if (energy >= 80) return 5;
    if (energy >= 60) return 4;
    if (energy >= 40) return 3;
    if (energy >= 20) return 2;
    return 1;
};

/**
 * Calculates the total passive energy drain based on time elapsed.
 * Includes a 30-minute grace period where no drain occurs.
 *
 * @param lastTimestamp - The Unix timestamp of the last energy update.
 * @param currentTimestamp - The current Unix timestamp.
 * @returns The amount of energy to drain.
 */
export const calculatePassiveDrain = (lastTimestamp: number, currentTimestamp: number): number => {
  const msDiff = currentTimestamp - lastTimestamp;
  const hoursDiff = msDiff / (1000 * 60 * 60);
  
  if (hoursDiff <= 0.5) return 0; // 30 min grace period
  
  return Math.floor(hoursDiff * PASSIVE_DRAIN_RATE_PER_HOUR);
};

/**
 * Calculates the net energy change (impact) resulting from a task session.
 * Considers task duration, user mood, and whether the task went over its planned time.
 *
 * @param actualDurationSeconds - Total time spent on the task.
 * @param plannedDurationSeconds - The task's estimated duration.
 * @param mood - User-reported mood after the task.
 * @returns The total energy delta (can be negative for drain or positive for gain).
 */
export const calculateSessionImpact = (
    actualDurationSeconds: number, 
    plannedDurationSeconds: number, 
    mood: 'Energized' | 'Neutral' | 'Drained'
): number => {
    const actualHours = actualDurationSeconds / 3600;
    const plannedHours = plannedDurationSeconds / 3600;
    
    let taskRate = 0; // Positive = Drain, Negative = Gain

    if (mood === 'Neutral') taskRate = 2.5;
    else if (mood === 'Drained') taskRate = 3.75; // 1.5x drain
    else if (mood === 'Energized') taskRate = -5.0; // Negative drain = Gain

    // Overtime Logic: If > 1.2x planned duration AND planned duration was set (>0)
    const isOvertime = plannedDurationSeconds > 0 && actualDurationSeconds > (plannedDurationSeconds * 1.2);
    let totalDelta = 0;

    if (isOvertime && mood !== 'Energized') {
       const baseHours = plannedHours;
       const overHours = actualHours - plannedHours;
       
       // Base time cost
       totalDelta -= (baseHours * (taskRate + PASSIVE_DRAIN_RATE_PER_HOUR));
       
       // Overtime cost (2x task rate + passive)
       totalDelta -= (overHours * ((taskRate * 2) + PASSIVE_DRAIN_RATE_PER_HOUR));
    } else {
       // Normal calculation (also applies to open-ended tasks with 0 planned duration)
       totalDelta -= (actualHours * (taskRate + PASSIVE_DRAIN_RATE_PER_HOUR));
    }

    return Math.round(totalDelta);
};
