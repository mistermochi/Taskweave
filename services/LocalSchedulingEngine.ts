
import { TaskEntity, Category, EnergyLevel, SuggestionContext, Suggestion, WellbeingActivity, TaskPattern } from '../types/scheduling';

export class LocalSchedulingEngine {
  private static instance: LocalSchedulingEngine;

  private readonly WELLBEING_ACTIVITIES: WellbeingActivity[] = [
    {
      id: 'stretch-1',
      title: 'Quick Stretch Break',
      description: 'Stand up and stretch for 2 minutes',
      duration: 2,
      category: 'Wellbeing',
      energyRequirement: 'Low',
      type: 'stretching'
    },
    {
      id: 'breathing-1',
      title: 'Deep Breathing',
      description: 'Take 10 deep breaths to reset focus',
      duration: 3,
      category: 'Wellbeing',
      energyRequirement: 'Low',
      type: 'breathing'
    },
    {
      id: 'water-1',
      title: 'Hydration Break',
      description: 'Drink a glass of water',
      duration: 5,
      category: 'Wellbeing',
      energyRequirement: 'Low',
      type: 'water'
    },
    {
      id: 'walk-1',
      title: 'Short Walk',
      description: '5-minute walk to clear your mind',
      duration: 5,
      category: 'Wellbeing',
      energyRequirement: 'Low',
      type: 'walk'
    },
    {
      id: 'meditation-1',
      title: 'Mindful Pause',
      description: '3-minute meditation to recharge',
      duration: 3,
      category: 'Wellbeing',
      energyRequirement: 'Low',
      type: 'meditation'
    }
  ];

  public static getInstance(): LocalSchedulingEngine {
    if (!LocalSchedulingEngine.instance) {
      LocalSchedulingEngine.instance = new LocalSchedulingEngine();
    }
    return LocalSchedulingEngine.instance;
  }

  generateSuggestions(context: SuggestionContext): { suggestions: Suggestion[]; confidence: number } {
    const suggestions: Suggestion[] = [];
    let totalConfidence = 0;
    let suggestionCount = 0;

    // 1. Urgency-based filtering and scoring
    const tasks = this.getUrgencyFilteredTasks(context.tasks);
    
    // 2. Energy matching
    const energyAppropriate = this.getEnergyAppropriateTasks(tasks, context.energy);
    
    // 3. Backlog-aware scheduling (consider workload)
    const backlogAware = this.getBacklogAwareTasks(energyAppropriate, context.backlogCount);
    
    // 4. Pattern-based selection
    const patternOptimal = this.getPatternOptimalTasks(backlogAware, context.previousPatterns);

    // 5. Context-based Scoring (NEW)
    const contextOptimal = this.applyContextRules(patternOptimal, context);

    // Generate task suggestions (max 2 tasks)
    for (let i = 0; i < Math.min(2, contextOptimal.length); i++) {
      const task = contextOptimal[i];
      const suggestion: Suggestion = {
        id: crypto.randomUUID(),
        type: 'task',
        title: task.title,
        reason: this.getTaskReason(task, context),
        priority: this.calculateTaskPriority(task, context),
        estimatedDuration: task.duration,
        category: task.category,
        energyRequirement: task.energy,
        isUrgent: task.dueDate && task.dueDate < Date.now(),
        confidence: this.calculateTaskConfidence(task, context)
      };
      suggestions.push(suggestion);
      totalConfidence += suggestion.confidence;
      suggestionCount++;
    }

    // 6. Only add wellbeing suggestion if no other suggestions were returned OR explicitly needed
    const shouldForceWellbeing = context.energy < 30 || (context.userContext?.device.batteryLevel && context.userContext.device.batteryLevel < 0.15 && !context.userContext.device.isCharging);
    
    if (suggestions.length === 0 || shouldForceWellbeing) {
      const wellbeingSuggestion = this.getWellbeingSuggestion(context, 0);
      if (wellbeingSuggestion) {
        suggestions.push(wellbeingSuggestion);
        totalConfidence += wellbeingSuggestion.confidence;
        suggestionCount++;
      }
    }

    suggestions.sort((a, b) => (b.priority * b.confidence) - (a.priority * a.confidence));
    
    return {
      suggestions: suggestions.slice(0, 3), // Max 3 suggestions
      confidence: suggestionCount > 0 ? totalConfidence / suggestionCount : 0
    };
  }

  private applyContextRules(tasks: TaskEntity[], context: SuggestionContext): TaskEntity[] {
    if (!context.userContext) return tasks;

    const { temporal, location, device } = context.userContext;

    return tasks.map(task => {
      let scoreModifier = 0;

      // Rule 1: Work Hours / Location
      if (task.category === 'Work') {
        if (location.label === 'Work') scoreModifier += 20; 
        else if (location.label === 'Home' && !temporal.isWorkHours) scoreModifier -= 30; 
        else if (temporal.isWorkHours) scoreModifier += 10; 
      }

      // Rule 2: Personal Time
      if (task.category === 'Personal' || task.category === 'Hobbies') {
        if (!temporal.isWorkHours) scoreModifier += 15;
        if (location.label === 'Work') scoreModifier -= 20;
      }

      // Rule 3: Battery constraints
      if (device.batteryLevel !== undefined && device.batteryLevel < 0.2 && !device.isCharging) {
        if (task.duration > 20) scoreModifier -= 40;
      }

      // Rule 4: Network Connectivity
      const isFastConnection = device.networkType === 'wifi' || device.effectiveType === '4g';
      const isSlowOrCellular = device.networkType === 'cellular' || 
                               (device.effectiveType && ['slow-2g', '2g', '3g'].includes(device.effectiveType));

      if (isFastConnection) {
         if (task.category === 'Work') scoreModifier += 10;
         if (task.energy === 'High') scoreModifier += 5;
      }

      if (isSlowOrCellular) {
         if (task.category === 'Work') scoreModifier -= 15; 
         if (task.energy === 'High') scoreModifier -= 10;
         if (task.energy === 'Low') scoreModifier += 15; 
         if (task.category === 'Personal' || task.category === 'Wellbeing') scoreModifier += 10;
      }

      return {
        ...task,
        contextScore: scoreModifier
      };
    }).sort((a, b) => (b.contextScore || 0) - (a.contextScore || 0));
  }

  private getUrgencyFilteredTasks(tasks: TaskEntity[]): TaskEntity[] {
    const now = Date.now();
    const oneWeekFromNow = now + (7 * 24 * 60 * 60 * 1000);
    
    return tasks
      .filter(task => task.status === 'active')
      .map(task => {
        let urgencyScore = 0;
        if (task.dueDate && task.dueDate < now) {
          urgencyScore += 100;
        } else if (task.dueDate && task.dueDate < (now + 24 * 60 * 60 * 1000)) {
          urgencyScore += 50;
        } else if (task.dueDate && task.dueDate < oneWeekFromNow) {
          urgencyScore += 25;
        }
        return { ...task, urgencyScore };
      })
      .sort((a, b) => b.urgencyScore - a.urgencyScore);
  }

  private getEnergyAppropriateTasks(tasks: TaskEntity[], userEnergy: number): TaskEntity[] {
    const energyTolerance = 20; 
    return tasks.filter(task => {
      const taskEnergyRequirement = this.getTaskEnergyValue(task.energy);
      const minEnergy = Math.max(0, taskEnergyRequirement - energyTolerance);
      const maxEnergy = Math.min(100, taskEnergyRequirement + energyTolerance);
      return userEnergy >= minEnergy && userEnergy <= maxEnergy;
    });
  }

  private getBacklogAwareTasks(tasks: TaskEntity[], backlogCount: number): TaskEntity[] {
    if (backlogCount > 10) {
      return tasks.filter(task => task.duration <= 30).sort((a, b) => a.duration - b.duration);
    }
    if (backlogCount > 5) {
      const shortTasks = tasks.filter(task => task.duration <= 15);
      const mediumTasks = tasks.filter(task => task.duration > 15 && task.duration <= 45);
      const longTasks = tasks.filter(task => task.duration > 45);
      const result: TaskEntity[] = [];
      if (shortTasks.length > 0) result.push(shortTasks[0]);
      if (mediumTasks.length > 0) result.push(mediumTasks[0]);
      if (longTasks.length > 0 && result.length < 3) result.push(longTasks[0]);
      return result;
    }
    return tasks;
  }

  private getPatternOptimalTasks(tasks: TaskEntity[], patterns: TaskPattern[]): TaskEntity[] {
    if (patterns.length === 0) return tasks;
    const currentHour = new Date().getHours();
    const currentDayOfWeek = new Date().getDay();
    const relevantPatterns = patterns.filter(pattern => 
      Math.abs(pattern.timeOfDay - currentHour) <= 2 &&
      Math.abs(pattern.dayOfWeek - currentDayOfWeek) <= 1
    );
    if (relevantPatterns.length > 0) {
      const preferredCategories = this.getPreferredCategories(relevantPatterns);
      return tasks
        .map(task => ({
          ...task,
          categoryMatchScore: preferredCategories.includes(task.category) ? 10 : 0
        }))
        .sort((a, b) => b.categoryMatchScore - a.categoryMatchScore);
    }
    return tasks;
  }

  private getPreferredCategories(patterns: TaskPattern[]): Category[] {
    const categoryFrequency: { [key in Category]?: number } = {};
    patterns.forEach(pattern => {
      if (pattern.completed) {
        categoryFrequency[pattern.taskCategory] = (categoryFrequency[pattern.taskCategory] || 0) + 1;
      }
    });
    return Object.entries(categoryFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category as Category);
  }

  private getWellbeingSuggestion(context: SuggestionContext, currentTaskTime: number): Suggestion | null {
    const availableTime = context.availableMinutes - currentTaskTime;
    if (availableTime >= 10) { 
      const activity = this.WELLBEING_ACTIVITIES[
        Math.floor(Math.random() * this.WELLBEING_ACTIVITIES.length)
      ];
      return {
        id: crypto.randomUUID(),
        type: 'wellbeing',
        title: activity.title,
        reason: this.getWellbeingReason(activity, context),
        priority: 3,
        estimatedDuration: activity.duration,
        category: 'Wellbeing',
        energyRequirement: 'Low',
        confidence: 85
      };
    }
    return null;
  }

  private getTaskReason(task: TaskEntity & { urgencyScore?: number; categoryMatchScore?: number; contextScore?: number }, context: SuggestionContext): string {
    const reasons: string[] = [];
    const ctx = context.userContext;
    if (task.contextScore) {
        if (task.contextScore > 10 && ctx?.location.label === 'Home' && task.category !== 'Work') reasons.push("Perfect for home");
        if (task.contextScore < 0 && ctx?.device.batteryLevel && ctx.device.batteryLevel < 0.2) reasons.push("Battery saving");
        if (ctx?.device.networkType === 'wifi' && task.category === 'Work') reasons.push("Strong connection");
        if (ctx?.device.networkType === 'cellular' && task.energy === 'Low') reasons.push("Good for mobile");
    }
    if (task.urgencyScore && task.urgencyScore > 50) reasons.push('Urgent task');
    if (this.matchesEnergy(task.energy, context.energy)) reasons.push('Matches energy');
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 11 && task.category === 'Work') reasons.push('Peak productivity time');
    if (task.duration <= 15 && context.backlogCount > 8) reasons.push('Quick win');
    return reasons.slice(0, 2).join(', ') || 'Good fit for now';
  }

  private getWellbeingReason(activity: WellbeingActivity, context: SuggestionContext): string {
    if (context.energy < 40) return 'Recharge your energy';
    if (context.backlogCount > 8) return 'Mental reset';
    return 'Maintain focus';
  }

  private calculateTaskPriority(task: TaskEntity & { urgencyScore?: number; categoryMatchScore?: number; contextScore?: number }, context: SuggestionContext): number {
    let priority = 5; 
    if (task.urgencyScore) priority += Math.min(5, task.urgencyScore / 20);
    if (this.matchesEnergy(task.energy, context.energy)) priority += 2;
    if (task.contextScore) priority += (task.contextScore / 10);
    return Math.min(10, Math.max(1, priority));
  }

  private calculateTaskConfidence(task: TaskEntity & { contextScore?: number }, context: SuggestionContext): number {
    let confidence = 50; 
    if (this.matchesEnergy(task.energy, context.energy)) confidence += 20;
    if (task.contextScore && task.contextScore > 0) confidence += 25;
    if (task.dueDate && task.dueDate < Date.now()) confidence += 10;
    return Math.min(100, confidence);
  }

  private matchesEnergy(taskEnergy: EnergyLevel, userEnergy: number): boolean {
    const taskEnergyValue = this.getTaskEnergyValue(taskEnergy);
    return Math.abs(taskEnergyValue - userEnergy) <= 25;
  }

  private getTaskEnergyValue(energy: EnergyLevel): number {
    switch (energy) {
      case 'Low': return 25;
      case 'Medium': return 50;
      case 'High': return 75;
      default: return 50;
    }
  }
}
