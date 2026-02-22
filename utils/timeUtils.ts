
import { TaskEntity, RecurrenceConfig } from '../types';

export interface TaskTimeMetrics {
  totalSeconds: number;
  elapsed: number;
  remaining: number;
  progress: number; // 0 to 1
  isOvertime: boolean;
  status: 'idle' | 'running' | 'paused';
}

export const formatTimer = (seconds: number): string => {
  const isNegative = seconds < 0;
  const absSeconds = Math.abs(seconds);
  const mins = Math.floor(absSeconds / 60);
  const secs = absSeconds % 60;
  const sign = isNegative ? '+' : '';
  return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const calculateTaskTime = (task: TaskEntity | null): TaskTimeMetrics => {
  if (!task) {
    return { 
      totalSeconds: 1500, 
      elapsed: 0, 
      remaining: 1500, 
      progress: 0, 
      isOvertime: false, 
      status: 'idle' 
    };
  }

  const totalSeconds = task.duration * 60;
  let elapsed = 0;
  let status: 'idle' | 'running' | 'paused' = 'idle';

  if (task.lastStartedAt) {
    // RUNNING
    status = 'running';
    const now = Date.now();
    const currentSessionElapsed = (now - task.lastStartedAt) / 1000;
    
    // Fallback: If remainingSeconds is missing, assume fresh start (totalSeconds)
    const savedRemaining = typeof task.remainingSeconds === 'number' ? task.remainingSeconds : totalSeconds;
    
    // Current Remaining = Saved Snapshot - Time since start
    const currentRemaining = savedRemaining - currentSessionElapsed;
    elapsed = totalSeconds - currentRemaining;

  } else if (typeof task.remainingSeconds === 'number') {
    // PAUSED
    status = 'paused';
    elapsed = totalSeconds - task.remainingSeconds;
  } else {
    // IDLE
    status = 'idle';
    elapsed = 0;
  }

  const remaining = Math.ceil(totalSeconds - elapsed); // Ceil to avoid flickering at .999
  const isOvertime = remaining < 0;
  
  // Progress clamping (0 to 1)
  const progress = isOvertime ? 1 : Math.min(1, Math.max(0, elapsed / totalSeconds));

  return {
    totalSeconds,
    elapsed,
    remaining,
    progress,
    isOvertime,
    status
  };
};

// Returns the timestamp for 4:00 AM of the current "functional" day.
export const getStartOfDay = (now: number | Date = Date.now()): number => {
  const date = new Date(now);
  if (date.getHours() < 4) date.setDate(date.getDate() - 1);
  date.setHours(4, 0, 0, 0);
  return date.getTime();
};

export const syncRecurrenceToNewDate = (
  oldConfig: RecurrenceConfig, 
  newDateTimestamp: number
): RecurrenceConfig => {
  const newDate = new Date(newDateTimestamp);
  const newConfig = { ...oldConfig };

  if (newConfig.frequency === 'weekly') {
     if (!newConfig.weekDays || newConfig.weekDays.length <= 1) {
         newConfig.weekDays = [newDate.getDay()];
     }
  } else if (newConfig.frequency === 'monthly') {
      if (newConfig.monthlyType === 'relative') {
          const nth = Math.ceil(newDate.getDate() / 7);
          newConfig.weekOfMonth = nth > 4 ? 5 : nth;
          newConfig.weekDays = [newDate.getDay()];
      }
  }
  
  return newConfig;
};

// --- Recurrence Math ---

export const getNextRecurrenceDate = (baseDateTimestamp: number | undefined, config: RecurrenceConfig): number => {
  const now = new Date();
  const base = baseDateTimestamp ? new Date(baseDateTimestamp) : now;
  
  let nextDate = new Date(base);
  const interval = Math.max(1, config.interval);

  const performStep = (target: Date) => {
    switch (config.frequency) {
      case 'daily':
        target.setDate(target.getDate() + interval);
        break;

      case 'weekly':
        if (config.weekDays && config.weekDays.length > 0) {
          let found = false;
          // Step by day until we find a valid day in a valid week
          for (let i = 1; i <= (interval * 7) + 7; i++) {
            const testDate = new Date(target);
            testDate.setDate(testDate.getDate() + i);
            const currentDayOfWeek = testDate.getDay();
            if (config.weekDays.includes(currentDayOfWeek)) {
               const weeksDiff = Math.floor(i / 7);
               if (weeksDiff % interval === 0) {
                   target.setTime(testDate.getTime());
                   found = true;
                   break;
               }
            }
          }
          if (!found) target.setDate(target.getDate() + (interval * 7));
        } else {
          target.setDate(target.getDate() + (interval * 7));
        }
        break;

      case 'monthly':
        if (config.monthlyType === 'relative' && config.weekOfMonth && config.weekDays?.length) {
           target.setDate(1);
           target.setMonth(target.getMonth() + interval);
           const targetDayOfWeek = config.weekDays[0];
           const targetWeek = config.weekOfMonth;
           let currentDay = target.getDay();
           let distance = (targetDayOfWeek + 7 - currentDay) % 7;
           target.setDate(target.getDate() + distance);
           if (targetWeek === 5) {
               const testMonth = target.getMonth();
               while (target.getMonth() === testMonth) {
                   target.setDate(target.getDate() + 7);
               }
               target.setDate(target.getDate() - 7);
           } else {
               target.setDate(target.getDate() + (targetWeek - 1) * 7);
           }
        } else {
          const dayOfMonth = target.getDate();
          target.setDate(1); // Go to a safe day
          target.setMonth(target.getMonth() + interval);
          
          const lastDayOfNewMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
          
          target.setDate(Math.min(dayOfMonth, lastDayOfNewMonth));
        }
        break;

      case 'yearly':
         target.setFullYear(target.getFullYear() + interval);
         break;
    }
  };
  
  // Always calculate the next step from the base date first.
  performStep(nextDate);
  
  // Then, catch up if that calculated date is still in the past or today.
  const nowTs = now.getTime();
  let safetyCounter = 0;
  while (nextDate.getTime() <= nowTs && safetyCounter < 100) {
      performStep(nextDate);
      safetyCounter++;
  }

  return nextDate.getTime();
};

export const formatRecurrence = (config: RecurrenceConfig | undefined, baseDate: Date = new Date()): string => {
  if (!config) return "Does not repeat";
  
  const interval = config.interval || 1;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const ordinals = ['1st', '2nd', '3rd', '4th', 'Last'];

  if (config.frequency === 'daily') {
    return interval === 1 ? 'Daily' : `Every ${interval} days`;
  }

  if (config.frequency === 'weekly') {
    const dayStr = config.weekDays?.length === 7 ? 'Daily' : config.weekDays?.map(d => days[d]).join(', ') || 'Weekly';
    if (interval === 1) return dayStr;
    return `${dayStr} every ${interval}w`;
  }

  if (config.frequency === 'monthly') {
    const intervalStr = interval > 1 ? `every ${interval}m` : 'monthly';
    if (config.monthlyType === 'relative') {
      const weekIdx = (config.weekOfMonth || 1) - 1;
      const dayIdx = config.weekDays ? config.weekDays[0] : 0;
      return `${ordinals[weekIdx]} ${days[dayIdx]} ${intervalStr}`;
    }
    return `Day ${baseDate.getDate()} ${intervalStr}`;
  }

  if (config.frequency === 'yearly') {
    return interval === 1 ? 'Yearly' : `Every ${interval} years`;
  }

  return 'Repeats';
};
