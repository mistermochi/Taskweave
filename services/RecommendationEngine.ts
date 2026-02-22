
import { TaskEntity, Category, SuggestionContext, Suggestion, UserVital } from "@/types/scheduling";
import { LinUCBService, StrategyArm, ARM_NAMES } from "./LinUCBService";
import { AIService } from "./AIService";
import { AIPromptBuilder } from "./AIPromptBuilder";
import { normalizeEnergy } from "@/utils/energyUtils";

export class RecommendationEngine {
  private static instance: RecommendationEngine;

  static getInstance(): RecommendationEngine {
    if (!this.instance) this.instance = new RecommendationEngine();
    return this.instance;
  }

  // --- Calibration / Warm Start ---
  // Uses Gemini to generate synthetic training data for the current task list
  async calibrate(tasks: TaskEntity[]): Promise<number> {
    const ai = AIService.getInstance();
    if (!ai.isAvailable()) throw new Error("AI Service not configured");

    // 1. Get Synthetic Scenarios
    const scenarios = await ai.getCalibrationData(tasks);
    if (scenarios.length === 0) return 0;

    // 2. Convert to Training Samples
    const samples: { x: number[], arm: number, reward: number }[] = [];

    for (const s of scenarios) {
        // Find arm index
        const armIndex = ARM_NAMES.indexOf(s.strategy);
        if (armIndex === -1) continue;

        // Construct synthetic context
        const mockDate = new Date();
        mockDate.setHours(s.hour, 0, 0, 0);

        // Simulate "Last Task" if provided by AI to train Momentum/Palette Cleanser
        const mockCompleted: TaskEntity[] = [];
        if (s.lastCategory) {
            mockCompleted.push({
                id: 'synth-last',
                title: 'Synthetic Last Task',
                category: s.lastCategory as Category,
                duration: 30,
                energy: 'Medium',
                status: 'completed',
                createdAt: Date.now(),
                completedAt: mockDate.getTime() - (15 * 60000), // 15 mins ago
                actualDuration: 30 * 60
            } as TaskEntity);
        }

        const syntheticContext: SuggestionContext = {
            currentTime: mockDate,
            energy: s.energy,
            availableMinutes: 60, 
            tasks: tasks,
            tags: [], 
            completedTasks: mockCompleted, 
            backlogCount: tasks.length,
            previousPatterns: [],
            userContext: undefined 
        };

        const x = this.buildContextVector(syntheticContext);
        
        // Push sample with MAX reward (teaching the model this is "correct")
        samples.push({
            x,
            arm: armIndex,
            reward: 1.0
        });
    }

    // 3. Batch Train
    await LinUCBService.getInstance().batchTrain(samples);
    
    return samples.length;
  }

  async recalibrateFromHistory(allTasks: TaskEntity[], allVitals: UserVital[]): Promise<number> {
    const bandit = LinUCBService.getInstance();
    bandit.resetModel();

    const completedTasks = allTasks
      .filter(t => t.status === 'completed' && t.completedAt)
      .sort((a, b) => a.completedAt! - b.completedAt!);

    const sortedVitals = allVitals
      .filter(v => v.type === 'mood')
      .sort((a, b) => a.timestamp - b.timestamp);

    let processedCount = 0;
    
    // "Replay" history and learn from each organic completion
    for (const task of completedTasks) {
      const completionTime = task.completedAt!;
      
      let energyAtTime = 75; // Default energy
      const priorVital = sortedVitals.findLast(v => v.timestamp < completionTime);
      if (priorVital) {
        energyAtTime = normalizeEnergy(priorVital.value as number);
      }

      const previousCompletions = completedTasks.filter(t => t.completedAt! < completionTime);
      
      // Reconstruct which tasks were 'active' at that specific moment in time
      const activeTasksAtTime = allTasks.filter(t => {
        if (t.id === task.id) return false; // Exclude the task itself from its own context
        if (t.createdAt > completionTime) return false; // Was not created yet
        if (t.completedAt && t.completedAt < completionTime) return false; // Was already completed
        if (t.archivedAt && t.archivedAt < completionTime) return false; // Was already archived
        return true;
      });

      const context: SuggestionContext = {
        currentTime: new Date(completionTime),
        energy: energyAtTime,
        availableMinutes: 60,
        tasks: activeTasksAtTime,
        tags: [],
        completedTasks: previousCompletions,
        backlogCount: activeTasksAtTime.length,
        previousPatterns: [],
        userContext: undefined, 
      };
      
      await this.logOrganicSelection(task, context);
      processedCount++;
    }
    
    return processedCount;
  }

  async generateSuggestion(context: SuggestionContext): Promise<{ suggestion: Suggestion | null; strategy: string }> {
    const bandit = LinUCBService.getInstance();
    
    // 1. Feature Engineering (Context Vector x)
    const x = this.buildContextVector(context);

    // 2. Identify Valid Arms (Masking)
    const validArms = this.getValidStrategies(context);

    if (validArms.length === 0) {
      return { suggestion: null, strategy: "None" };
    }

    // 3. Ask the Oracle
    const { arm } = await bandit.predict(x, validArms);

    if (arm === -1) return { suggestion: null, strategy: "Fallback" };

    // 4. Resolve Strategy to Task
    const suggestion = this.resolveStrategy(arm, context);

    return {
      suggestion,
      strategy: ARM_NAMES[arm] || "Unknown"
    };
  }

  // --- Feature Engineering ---
  // Transforms complex app state into a fixed-length vector (d=11)
  // Changed to public for use in Calibration
  public buildContextVector(ctx: SuggestionContext): number[] {
    // 1. Bias
    const bias = 1.0;

    // 2. Time (Normalized Hour 0-1)
    const hour = ctx.currentTime.getHours() / 24;

    // 3. User Energy (0-1)
    const energy = ctx.energy / 100;

    // 4. Queue Pressure
    // Assuming 8 hours capacity (480 mins)
    const totalDuration = ctx.tasks.reduce((sum, t) => sum + t.duration, 0);
    const queuePressure = Math.min(1.0, totalDuration / 480);

    // 5. Urgency Ratio
    const urgentCount = ctx.tasks.filter(t => t.dueDate && t.dueDate < Date.now() + 86400000).length;
    const urgencyRatio = ctx.tasks.length > 0 ? urgentCount / ctx.tasks.length : 0;

    // 6-8. Last Task Data
    let timeSinceLast = 1.0; // Default long time
    let lastDuration = 0;
    let lastCats = [0, 0, 0, 0]; // Work, Wellbeing, Personal, Hobbies

    if (ctx.completedTasks.length > 0) {
      // Sort desc
      const last = ctx.completedTasks.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))[0];
      
      // Time Since (Inverse decay: 1.0 = immediate, 0.0 = >4 hours ago)
      const msSince = Date.now() - (last.completedAt || 0);
      const hoursSince = msSince / (1000 * 60 * 60);
      timeSinceLast = Math.max(0, 1.0 - (hoursSince / 4));

      // Duration (Normalized to 60m)
      lastDuration = Math.min(1.0, (last.actualDuration || last.duration * 60) / 3600);

      // Category One-Hot
      if (last.category === 'Work') lastCats[0] = 1;
      else if (last.category === 'Wellbeing') lastCats[1] = 1;
      else if (last.category === 'Personal') lastCats[2] = 1;
      else if (last.category === 'Hobbies') lastCats[3] = 1;
    }

    return [
      bias, 
      hour, 
      energy, 
      queuePressure, 
      urgencyRatio, 
      timeSinceLast, 
      lastDuration, 
      ...lastCats
    ];
  }

  // --- Arm Validity ---
  private getValidStrategies(ctx: SuggestionContext): number[] {
    const allActiveTasks = ctx.tasks;
    const isBlocked = (task: TaskEntity): boolean => {
        if (!task.blockedBy || task.blockedBy.length === 0) return false;
        return task.blockedBy.some(blockerId => allActiveTasks.some(t => t.id === blockerId));
    };
    const t = allActiveTasks.filter(t => !isBlocked(t)); // Use unblocked tasks

    const indices: number[] = [];
    
    // Safely get the most recent completed task
    const last = ctx.completedTasks.length > 0 
        ? [...ctx.completedTasks].sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))[0] 
        : null;
    const hour = ctx.currentTime.getHours();

    // 1. DEEP FLOW: Needs High Energy task > 30m
    if (t.some(x => x.energy === 'High' && x.duration > 30)) indices.push(StrategyArm.DEEP_FLOW);

    // 2. QUICK SPARK: High Energy but short
    if (t.some(x => x.energy === 'High' && x.duration <= 20)) indices.push(StrategyArm.QUICK_SPARK);

    // 3. MOMENTUM: Same category as last
    if (last && t.some(x => x.category === last.category)) indices.push(StrategyArm.MOMENTUM);

    // 4. PALETTE CLEANSER: Different category
    if (last && t.some(x => x.category !== last.category)) indices.push(StrategyArm.PALETTE_CLEANSER);

    // 5. THE CRUSHER: Urgent tasks
    if (t.some(x => x.dueDate && x.dueDate < Date.now() + 86400000)) indices.push(StrategyArm.THE_CRUSHER);

    // 6. LOW GEAR: Low energy tasks
    if (t.some(x => x.energy === 'Low')) indices.push(StrategyArm.LOW_GEAR);

    // 7 & 8. RESETS: Always valid (can always suggest a break)
    indices.push(StrategyArm.SOMATIC_RESET);
    indices.push(StrategyArm.COGNITIVE_RESET);

    // 9. NO_OP: Always valid (The "Do Nothing" baseline)
    indices.push(StrategyArm.NO_OP);

    // 10. PULL_BACK: Valid if system is under stress
    const totalDuration = ctx.tasks.reduce((sum, task) => sum + task.duration, 0);
    if (totalDuration > 180 || ctx.energy < 40) {
        indices.push(StrategyArm.PULL_BACK);
    }

    // 11. THE ARCHAEOLOGIST: Stale tasks (> 14 days old, no due date)
    const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
    if (t.some(x => x.createdAt < fourteenDaysAgo && !x.dueDate)) {
        indices.push(StrategyArm.ARCHAEOLOGIST);
    }

    // 12. SNOWBALL: Velocity Batching (Small after Small)
    if (last && last.duration <= 15 && t.some(x => x.duration <= 15)) {
        indices.push(StrategyArm.SNOWBALL);
    }

    // 13. TWILIGHT RITUAL: Evening (17:00 - 22:00) with Low Energy tasks
    if (hour >= 17 && hour < 22 && t.some(x => x.energy === 'Low')) {
        indices.push(StrategyArm.TWILIGHT_RITUAL);
    }

    return indices;
  }

  // --- Strategy Resolution ---
  private resolveStrategy(arm: number, ctx: SuggestionContext): Suggestion | null {
    const allActiveTasks = ctx.tasks;
    const isBlocked = (task: TaskEntity): boolean => {
        if (!task.blockedBy || task.blockedBy.length === 0) return false;
        return task.blockedBy.some(blockerId => allActiveTasks.some(t => t.id === blockerId));
    };
    let tasks = allActiveTasks.filter(t => !isBlocked(t));
    
    const last = ctx.completedTasks.length > 0 ? ctx.completedTasks[0] : null;
    let chosenTask: TaskEntity | null = null;
    let type: 'task' | 'wellbeing' = 'task';
    let reason = "";

    switch (arm) {
      case StrategyArm.DEEP_FLOW:
        // Filter: High Energy, Long. Sort: Priority/Urgency
        tasks = tasks.filter(t => t.energy === 'High' && t.duration > 30);
        chosenTask = this.pickBest(tasks);
        reason = "Deep Flow: Capitalize on your energy.";
        break;

      case StrategyArm.QUICK_SPARK:
        tasks = tasks.filter(t => t.energy === 'High' && t.duration <= 20);
        chosenTask = this.pickBest(tasks);
        reason = "Quick Spark: Build momentum fast.";
        break;

      case StrategyArm.MOMENTUM:
        if (last) tasks = tasks.filter(t => t.category === last.category);
        chosenTask = this.pickBest(tasks);
        const tagName = ctx.tags.find(t => t.id === last?.category)?.name || last?.category;
        reason = `Momentum: Stay in the ${tagName} zone.`;
        break;

      case StrategyArm.PALETTE_CLEANSER:
        if (last) tasks = tasks.filter(t => t.category !== last.category);
        chosenTask = this.pickBest(tasks);
        reason = "Palette Cleanser: Switch context to stay fresh.";
        break;

      case StrategyArm.THE_CRUSHER:
        tasks = tasks.filter(t => t.dueDate && t.dueDate < Date.now() + 86400000);
        // Sort specifically by due date here
        chosenTask = tasks.sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0))[0];
        reason = "The Crusher: Clear urgent items.";
        break;

      case StrategyArm.LOW_GEAR:
        tasks = tasks.filter(t => t.energy === 'Low');
        chosenTask = this.pickBest(tasks);
        reason = "Low Gear: Productive despite low energy.";
        break;

      case StrategyArm.SOMATIC_RESET:
        type = 'wellbeing';
        reason = "Somatic Reset: Move your body to refuel.";
        break;

      case StrategyArm.COGNITIVE_RESET:
        type = 'wellbeing';
        reason = "Cognitive Reset: Clear your mind.";
        break;

      case StrategyArm.NO_OP:
        // Algorithm explicitly suggests nothing
        return null;

      case StrategyArm.PULL_BACK:
        // Algorithm warns against adding more
        type = 'wellbeing';
        reason = "Capacity Reached: Focus on current queue.";
        break;

      case StrategyArm.ARCHAEOLOGIST:
        const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
        tasks = tasks.filter(t => t.createdAt < fourteenDaysAgo && !t.dueDate);
        // Pick oldest first
        chosenTask = tasks.sort((a, b) => a.createdAt - b.createdAt)[0]; 
        reason = "The Archaeologist: Clear stagnant items.";
        break;

      case StrategyArm.SNOWBALL:
        tasks = tasks.filter(t => t.duration <= 15);
        chosenTask = this.pickBest(tasks);
        reason = "Snowball Effect: Stack small wins.";
        break;

      case StrategyArm.TWILIGHT_RITUAL:
        tasks = tasks.filter(t => t.energy === 'Low');
        chosenTask = this.pickBest(tasks);
        reason = "Twilight Ritual: Wind down productively.";
        break;
    }

    if (type === 'wellbeing') {
      return {
        id: 'wellbeing-gen',
        type: 'wellbeing',
        title: arm === StrategyArm.PULL_BACK ? "Review Queue" : (arm === StrategyArm.SOMATIC_RESET ? "Stretch & Hydrate" : "2min Breathe"),
        reason,
        priority: 10,
        estimatedDuration: 5,
        category: 'Wellbeing',
        energyRequirement: 'Low',
        confidence: 90
      };
    }

    if (chosenTask) {
      return {
        id: crypto.randomUUID(), // ID for the suggestion card
        taskId: chosenTask.id,   // ID for the underlying task
        type: 'task',
        title: chosenTask.title,
        reason,
        priority: 10,
        estimatedDuration: chosenTask.duration,
        category: chosenTask.category,
        energyRequirement: chosenTask.energy,
        confidence: 85,
      };
    }

    return null;
  }

  // Optimized selection: O(N) scan instead of O(N log N) sort
  // Picks the task with earliest due date, then most recent creation
  private pickBest(tasks: TaskEntity[]): TaskEntity | null {
    if (tasks.length === 0) return null;
    
    let best = tasks[0];
    
    for (let i = 1; i < tasks.length; i++) {
        const current = tasks[i];
        
        // Criteria 1: Due Date (Ascending)
        if (current.dueDate && best.dueDate) {
            if (current.dueDate < best.dueDate) {
                best = current;
                continue;
            }
        } else if (current.dueDate && !best.dueDate) {
            // Current has due date, best doesn't -> Current wins
            best = current;
            continue;
        } else if (!current.dueDate && best.dueDate) {
            // Best has due date, current doesn't -> Best stays
            continue;
        }

        // Criteria 2: Creation Date (Descending / LIFO for same urgency)
        // Only if due date status is equal (both have it and are equal, or neither have it)
        if (current.createdAt > best.createdAt) {
            best = current;
        }
    }
    
    return best;
  }

  // Feedback Loop Entry Point
  async logCompletion(ctx: SuggestionContext, strategyName: string, success: boolean) {
    const armIdx = ARM_NAMES.indexOf(strategyName);
    if (armIdx === -1) return;

    const x = this.buildContextVector(ctx);
    const reward = success ? 1.0 : -0.2; // Simple reward shaping
    
    await LinUCBService.getInstance().update(x, armIdx, reward);
  }

  // Log negative feedback when suggestion is ignored/skipped
  async logRejection(ctx: SuggestionContext, strategyName: string) {
    const armIdx = ARM_NAMES.indexOf(strategyName);
    if (armIdx === -1) return;

    const x = this.buildContextVector(ctx);
    // Stronger penalty for explicit rejection/ignore than just "not success"
    // This helps the bandit learn faster to avoid bad suggestions
    const reward = -0.5; 
    
    await LinUCBService.getInstance().update(x, armIdx, reward);
  }

  // Inverse Strategy Learning
  // When a user manually picks a task, we find which strategies WOULD have suggested it
  // and reward them. This solves cold start by learning from organic behavior.
  async logOrganicSelection(task: TaskEntity, context: SuggestionContext) {
    const validArms = this.getValidStrategies(context);
    const x = this.buildContextVector(context);
    const last = context.completedTasks.length > 0 
        ? [...context.completedTasks].sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))[0] 
        : null;

    // Iterate through all valid arms and check if this task COULD have been generated by them
    for (const arm of validArms) {
      let matches = false;

      switch (arm) {
        case StrategyArm.DEEP_FLOW:
          matches = task.energy === 'High' && task.duration > 30;
          break;
        case StrategyArm.QUICK_SPARK:
          matches = task.energy === 'High' && task.duration <= 20;
          break;
        case StrategyArm.MOMENTUM:
          matches = !!last && task.category === last.category;
          break;
        case StrategyArm.PALETTE_CLEANSER:
          matches = !!last && task.category !== last.category;
          break;
        case StrategyArm.THE_CRUSHER:
           // 24h urgency check
          matches = !!(task.dueDate && task.dueDate < Date.now() + 86400000);
          break;
        case StrategyArm.LOW_GEAR:
          matches = task.energy === 'Low';
          break;
        case StrategyArm.ARCHAEOLOGIST:
          const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
          matches = task.createdAt < fourteenDaysAgo && !task.dueDate;
          break;
        case StrategyArm.SNOWBALL:
          matches = !!last && last.duration <= 15 && task.duration <= 15;
          break;
        case StrategyArm.TWILIGHT_RITUAL:
          const h = context.currentTime.getHours();
          matches = h >= 17 && h < 22 && task.energy === 'Low';
          break;
        // Wellbeing / No-op strategies don't map to organic Task selection
        default:
          matches = false;
      }

      if (matches) {
         // Positive reward for this strategy because it aligns with user choice
         await LinUCBService.getInstance().update(x, arm, 1.0);
      }
    }
  }
}
