
import { TaskPattern, Category } from '../types/scheduling';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { ContextService } from './ContextService';

export class LearningEngine {
  private readonly COLLECTION = 'activityLogs';
  private readonly MAX_PATTERNS = 50; 
  private readonly LEARNING_WINDOW_DAYS = 30;

  async recordDecision(context: TaskPattern, userChoice: Category, success: boolean): Promise<void> {
    const uid = ContextService.getInstance().getUserId();
    if (!uid) return;

    try {
      await addDoc(collection(db, 'users', uid, this.COLLECTION), {
        timestamp: Date.now(),
        type: 'task_complete',
        shiftType: null,
        weekOfYear: 0,
        data: {
          userMood: `${userChoice} selected`,
          energyLevel: context.energyLevel,
          notes: `Task: ${context.taskCategory}, Success: ${success}, Time: ${context.timeOfDay}`,
          // Store specific pattern data flat in 'data' for easier retrieval reconstruction
          taskCategory: context.taskCategory,
          timeOfDay: context.timeOfDay,
          dayOfWeek: context.dayOfWeek,
          completed: success
        }
      });
    } catch (e) {
      console.error("Failed to record learning decision:", e);
    }
  }

  async getLearnedPatterns(): Promise<TaskPattern[]> {
    const uid = ContextService.getInstance().getUserId();
    if (!uid) return [];

    const thirtyDaysAgo = Date.now() - (this.LEARNING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    
    try {
        const q = query(
            collection(db, 'users', uid, this.COLLECTION),
            where('type', '==', 'task_complete'),
            where('timestamp', '>=', thirtyDaysAgo),
            orderBy('timestamp', 'desc'),
            limit(100)
        );

        const snapshot = await getDocs(q);
        const patterns: TaskPattern[] = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            const innerData = data.data || {};
            
            // Reconstruct pattern from Firestore data
            // Fallback values provided for legacy data integrity
            patterns.push({
                taskCategory: (innerData.taskCategory as Category) || 'Work',
                timeOfDay: innerData.timeOfDay !== undefined ? innerData.timeOfDay : new Date(data.timestamp).getHours(),
                dayOfWeek: innerData.dayOfWeek !== undefined ? innerData.dayOfWeek : new Date(data.timestamp).getDay(),
                energyLevel: innerData.energyLevel || 50,
                completed: innerData.completed !== undefined ? innerData.completed : true,
                timestamp: data.timestamp
            });
        });

        return patterns;
    } catch (e) {
        console.warn("Failed to fetch learned patterns from Firestore:", e);
        return [];
    }
  }

  calculateCategoryPreferences(patterns: TaskPattern[]): { [key in Category]?: number } {
    const preferences: { [key in Category]?: number } = {};
    const categorySuccess: { [key in Category]?: { total: number; completed: number } } = {};
    
    patterns.forEach(pattern => {
      if (!categorySuccess[pattern.taskCategory]) {
        categorySuccess[pattern.taskCategory] = { total: 0, completed: 0 };
      }
      
      categorySuccess[pattern.taskCategory]!.total++;
      if (pattern.completed) {
        categorySuccess[pattern.taskCategory]!.completed++;
      }
    });

    Object.keys(categorySuccess).forEach(category => {
      const cat = category as Category;
      const success = categorySuccess[cat]!;
      const successRate = success.completed / success.total;
      
      if (successRate > 0) { 
        preferences[cat] = successRate;
      }
    });

    return preferences;
  }

  calculateOptimalTimeSlots(patterns: TaskPattern[]): { morning: number; afternoon: number; evening: number } {
    const timeSlots = { morning: 0, afternoon: 0, evening: 0 };
    const slotCounts = { morning: 0, afternoon: 0, evening: 0 };
    
    patterns.forEach(pattern => {
      const hour = pattern.timeOfDay;
      let slot: keyof typeof timeSlots;
      
      if (hour >= 6 && hour < 12) {
        slot = 'morning';
      } else if (hour >= 12 && hour < 18) {
        slot = 'afternoon';
      } else {
        slot = 'evening';
      }
      
      slotCounts[slot]++;
      if (pattern.completed) {
        timeSlots[slot]++;
      }
    });

    const successRates: typeof timeSlots = {
      morning: slotCounts.morning > 0 ? timeSlots.morning / slotCounts.morning : 0,
      afternoon: slotCounts.afternoon > 0 ? timeSlots.afternoon / slotCounts.afternoon : 0,
      evening: slotCounts.evening > 0 ? timeSlots.evening / slotCounts.evening : 0
    };

    return successRates;
  }

  getTaskDurationPreferences(patterns: TaskPattern[]): { short: number; medium: number; long: number } {
    const durations = { short: 0, medium: 0, long: 0 };
    const durationCounts = { short: 0, medium: 0, long: 0 };
    
    patterns.forEach(pattern => {
      const taskDuration = 30; // Implicit duration if not stored, could be improved by storing duration in activityLog
      
      let durationType: keyof typeof durations;
      if (taskDuration <= 15) {
        durationType = 'short';
      } else if (taskDuration <= 45) {
        durationType = 'medium';
      } else {
        durationType = 'long';
      }
      
      durationCounts[durationType]++;
      if (pattern.completed) {
        durations[durationType]++;
      }
    });

    const successRates: typeof durations = {
      short: durationCounts.short > 0 ? durations.short / durationCounts.short : 0,
      medium: durationCounts.medium > 0 ? durations.medium / durationCounts.medium : 0,
      long: durationCounts.long > 0 ? durations.long / durationCounts.long : 0
    };

    return successRates;
  }

  calculateEnergyAlignment(patterns: TaskPattern[]): { lowEnergy: number; mediumEnergy: number; highEnergy: number } {
    const energyLevels = { lowEnergy: 0, mediumEnergy: 0, highEnergy: 0 };
    const energyCounts = { lowEnergy: 0, mediumEnergy: 0, highEnergy: 0 };
    
    patterns.forEach(pattern => {
      let energyType: keyof typeof energyLevels;
      
      if (pattern.energyLevel <= 33) {
        energyType = 'lowEnergy';
      } else if (pattern.energyLevel <= 66) {
        energyType = 'mediumEnergy';
      } else {
        energyType = 'highEnergy';
      }
      
      energyCounts[energyType]++;
      if (pattern.completed) {
        energyLevels[energyType]++;
      }
    });

    const successRates: typeof energyLevels = {
      lowEnergy: energyCounts.lowEnergy > 0 ? energyLevels.lowEnergy / energyCounts.lowEnergy : 0,
      mediumEnergy: energyCounts.mediumEnergy > 0 ? energyLevels.mediumEnergy / energyCounts.mediumEnergy : 0,
      highEnergy: energyCounts.highEnergy > 0 ? energyLevels.highEnergy / energyCounts.highEnergy : 0
    };

    return successRates;
  }

  async generateInsights(): Promise<string[]> {
    const insights: string[] = [];
    const patterns = await this.getLearnedPatterns();
    
    if (patterns.length === 0) {
      insights.push('Keep completing tasks to get personalized suggestions');
      return insights;
    }

    const categoryPrefs = this.calculateCategoryPreferences(patterns);
    const timeSlots = this.calculateOptimalTimeSlots(patterns);
    const energyAlignment = this.calculateEnergyAlignment(patterns);

    Object.entries(categoryPrefs).forEach(([category, rate]) => {
      if (rate > 0.8) {
        insights.push(`You complete ${category} tasks ${Math.round(rate * 100)}% of the time`);
      } else if (rate < 0.5) {
        insights.push(`Consider breaking ${category} tasks into smaller steps`);
      }
    });

    const bestTimeSlot = Object.entries(timeSlots).reduce((best, [slot, rate]) => 
      rate > best.rate ? { slot, rate } : best, { slot: '', rate: 0 });
    
    if (bestTimeSlot.rate > 0.7) {
      insights.push(`Your most productive time is ${bestTimeSlot.slot}`);
    }

    const bestEnergy = Object.entries(energyAlignment).reduce((best, [level, rate]) => 
      rate > best.rate ? { level, rate } : best, { level: '', rate: 0 });
    
    if (bestEnergy.rate > 0.7) {
      const energyLevel = bestEnergy.level.replace('Energy', '').toLowerCase();
      insights.push(`You work best at ${energyLevel} energy levels`);
    }

    return insights;
  }
}
