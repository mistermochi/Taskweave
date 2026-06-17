import { Task, Category, SuggestionContext, Suggestion, UserVital } from "@/types/scheduling";
import { LinUCBService, StrategyArm, ARM_NAMES } from "./LinUCBService";
import { AIService } from "./AIService";
import { AIPromptBuilder } from "./AIPromptBuilder";
import { normalizeEnergy } from "@/shared/lib/energyUtils";

/**
 * High-level service that manages the generation of task and wellbeing suggestions.
 * It integrates the `LinUCBService` (machine learning) with `AIService` (Gemini)
 * and local heuristics to provide personalized recommendations.
 *
 * @singleton Use `RecommendationEngine.getInstance()` to access the service.
 */
export class RecommendationEngine {
  /** Singleton instance of the engine. */
  private static instance: RecommendationEngine;

  /**
   * Private constructor for singleton pattern.
   */
  private constructor() {}

  /**
   * Returns the singleton instance of RecommendationEngine.
   * @returns The RecommendationEngine instance.
   */
  static getInstance(): RecommendationEngine {
    if (!this.instance) this.instance = new RecommendationEngine();
    return this.instance;
  }

  /**
   * Performs a "warm start" calibration of the machine learning model.
   * It uses the AI service to generate synthetic scenarios based on the user's current tasks
   * and trains the LinUCB model on these scenarios.
   *
   * @param tasks - The user's actual task list to use as context for calibration.
   * @returns A promise resolving to the number of synthetic samples trained.
   *
   * @logic
   * 1. Fetches synthetic scenarios from `AIService.getCalibrationData`.
   * 2. Maps each scenario to a context vector and strategy arm.
   * 3. Performs batch training on the `LinUCBService`.
   */
  async calibrate(tasks: Task[]): Promise<number> {
    const ai = AIService.getInstance();
    if (!ai.isAvailable()) throw new Error("AI Service not configured");

    const scenarios = await ai.getCalibrationData(tasks);
    if (scenarios.length === 0) return 0;

    const samples: { x: number[], arm: number, reward: number }[] = [];

    for (const s of scenarios) {
        const armIndex = ARM_NAMES.indexOf(s.strategy);
        if (armIndex === -1) continue;

        const mockDate = new Date();
        mockDate.setHours(s.hour, 0, 0, 0);

        const mockCompleted: Task[] = [];
        if (s.lastCategory) {
            mockCompleted.push({
                id: 'synth-last',
                title: 'Synthetic Last Task',
                category: s.lastCategory as Category,
                duration: 30,
                energy: 'Medium',
                status: 'completed',
                createdAt: Date.now(),
                completedAt: mockDate.getTime() - (15 * 60000),
                actualDuration: 30 * 60
            } as Task);
        }

        const syntheticContext: SuggestionContext = {
            currentTime: mockDate,
            energy: s.energy,
            tasks: tasks,
            tags: [], 
            completedTasks: mockCompleted, 
        };

        const x = this.buildContextVector(syntheticContext);
        
        samples.push({
            x,
            arm: armIndex,
            reward: 1.0
        });
    }

    await LinUCBService.getInstance().batchTrain(samples);
    
    return samples.length;
  }

  /**
   * Resets the model and re-trains it by "replaying" the user's entire task history.
   * This aligns the model with the user's organic behavior and historical success patterns.
   *
   * @param allTasks - All tasks (active and completed).
   * @param allVitals - User wellness data (mood/energy logs).
   * @returns A promise resolving to the number of historical events processed.
   *
   * @logic
   * Bolt ⚡ Optimization:
   * 1. Collects all training samples in a single pass to perform ONE Firestore write.
   * 2. Reuses pre-sorted arrays and pointers for O(1) amortized lookup.
   * 3. Avoids O(N) array scans inside the history loop.
   */
  async recalibrateFromHistory(allTasks: Task[], allVitals: UserVital[]): Promise<number> {
    const bandit = LinUCBService.getInstance();
    bandit.resetModel();

    const completedTasks = allTasks
      .filter(t => t.status === 'completed' && t.completedAt)
      .sort((a, b) => a.completedAt! - b.completedAt!);

    const sortedVitals = allVitals
      .filter(v => v.type === 'mood')
      .sort((a, b) => a.timestamp - b.timestamp);

    // Bolt ⚡ Optimization: Timeline-based sliding window for O(N log N) history replay.
    // We pre-sort tasks by creation and removal times to maintain an "active pool"
    // without O(N) filtering in the loop.
    const tasksByCreated = [...allTasks].sort((a, b) => a.createdAt - b.createdAt);
    const tasksByRemoved = [...allTasks].sort((a, b) => {
      const aTime = a.completedAt || a.archivedAt || Infinity;
      const bTime = b.completedAt || b.archivedAt || Infinity;
      return aTime - bTime;
    });

    let processedCount = 0;
    let vitalPointer = 0;
    let createPtr = 0;
    let removePtr = 0;
    const activePool = new Map<string, Task>();
    const previousCompletions: Task[] = [];
    const allSamples: { x: number[], arm: number, reward: number }[] = [];
    
    for (let i = 0; i < completedTasks.length; i++) {
      const task = completedTasks[i];
      const completionTime = task.completedAt!;
      
      let energyAtTime = 75;

      // 1. Advance energy/vital pointer
      // Bolt ⚡: Use <= to include vitals exactly at completion time (original behavior)
      while (vitalPointer < sortedVitals.length && sortedVitals[vitalPointer].timestamp <= completionTime) {
          vitalPointer++;
      }
      if (vitalPointer > 0) {
          energyAtTime = normalizeEnergy(sortedVitals[vitalPointer - 1].value as number);
      }

      // 2. Advance active pool: Add newly created tasks
      while (createPtr < tasksByCreated.length && tasksByCreated[createPtr].createdAt <= completionTime) {
        const t = tasksByCreated[createPtr];
        activePool.set(t.id, t);
        createPtr++;
      }

      // 3. Advance active pool: Remove tasks that were completed or archived before now
      while (removePtr < tasksByRemoved.length) {
        const t = tasksByRemoved[removePtr];
        const removalTime = t.completedAt || t.archivedAt || Infinity;
        if (removalTime < completionTime) {
          activePool.delete(t.id);
          removePtr++;
        } else {
          break;
        }
      }

      // 4. Construct context for this completion event.
      // Bolt ⚡ Optimization: activeTasksAtTime is pool minus current task.
      // We use .forEach to avoid double allocation (Array.from + filter)
      // and satisfy TS downlevelIteration constraints for ES5 targets.
      const activeTasksAtTime: TaskEntity[] = [];
      activePool.forEach(t => {
        if (t.id !== task.id) {
          activeTasksAtTime.push(t);
        }
      });
      const lastTask = i > 0 ? completedTasks[i - 1] : undefined;

      const context: SuggestionContext = {
        currentTime: new Date(completionTime),
        energy: energyAtTime,
        tasks: activeTasksAtTime,
        tags: [],
        completedTasks: previousCompletions, // Bolt ⚡: Maintain history for feature extraction
        lastTask, // Bolt ⚡: Pass pre-identified last task
        activeTaskIds: activePool, // Bolt ⚡: Pass existing active pool Map for O(1) blocking check without allocation
      };
      
      const samples = this.getOrganicSamples(task, context);
      allSamples.push(...samples);
      previousCompletions.push(task); // Bolt ⚡: Running O(1) push to maintain history
      processedCount++;
    }

    if (allSamples.length > 0) {
        await bandit.batchTrain(allSamples);
    }
    
    return processedCount;
  }

  /**
   * Generates a personalized recommendation by querying the LinUCB bandit model.
   *
   * @param context - The current user and application context.
   * @returns A promise resolving to the generated `Suggestion` and the name of the chosen strategy.
   */
  async generateSuggestion(context: SuggestionContext): Promise<{ suggestion: Suggestion | null; strategy: string }> {
    const bandit = LinUCBService.getInstance();
    
    // Bolt ⚡ Optimization: Use provided lastTask or calculate once for all sub-operations.
    const lastTask = context.lastTask || this.getLatestCompletedTask(context.completedTasks) || undefined;

    // 1. Feature Engineering (Context Vector x)
    const x = this.buildContextVector(context, lastTask);

    // 2. Identify Valid Arms (Masking)
    const validArms = this.getValidStrategies(context, lastTask);

    if (validArms.length === 0) {
      return { suggestion: null, strategy: "None" };
    }

    // 3. Ask the Oracle
    const { arm } = await bandit.predict(x, validArms);

    if (arm === -1) return { suggestion: null, strategy: "Fallback" };

    // 4. Resolve Strategy to Task
    const suggestion = this.resolveStrategy(arm, context, lastTask);

    return {
      suggestion,
      strategy: ARM_NAMES[arm] || "Unknown"
    };
  }

  /**
   * Transforms the complex `SuggestionContext` into a fixed-length numeric vector (d=11).
   * This vector is the input for the LinUCB machine learning model.
   *
   * @param ctx - The suggestion context.
   * @param lastTask - Optional pre-identified last completed task to avoid O(N) search.
   * @returns A number array representing the context features.
   *
   * @features
   * 1. Bias (constant 1.0)
   * 2. Time of day (normalized 0-1)
   * 3. User energy (normalized 0-1)
   * 4. Queue pressure (total duration of active tasks)
   * 5. Urgency ratio (percentage of tasks near deadline)
   * 6. Recency of last completion (decaying score)
   * 7. Duration of last task (normalized)
   * 8-11. Category of last task (One-hot encoded: Work, Wellbeing, Personal, Hobbies)
   */
  public buildContextVector(ctx: SuggestionContext, providedLastTask?: Task): number[] {
    const bias = 1.0;
    const hour = ctx.currentTime.getHours() / 24;
    const energy = ctx.energy / 100;

    // Bolt ⚡ Optimization: Single O(N) pass to aggregate task metrics.
    let totalDuration = 0;
    let urgentCount = 0;
    const now = ctx.currentTime.getTime();
    const oneDayFromNow = now + 86400000;

    for (const task of ctx.tasks) {
      totalDuration += task.duration;
      if (task.dueDate && task.dueDate < oneDayFromNow) {
        urgentCount++;
      }
    }

    const queuePressure = Math.min(1.0, totalDuration / 480);
    const urgencyRatio = ctx.tasks.length > 0 ? urgentCount / ctx.tasks.length : 0;

    let timeSinceLast = 1.0;
    let lastDuration = 0;
    let lastCats = [0, 0, 0, 0];

    const last = providedLastTask || ctx.lastTask || (ctx.completedTasks.length > 0 ? this.getLatestCompletedTask(ctx.completedTasks) : null);

    if (last) {
      const msSince = now - (last.completedAt || 0);
      const hoursSince = msSince / (1000 * 60 * 60);
      timeSinceLast = Math.max(0, 1.0 - (hoursSince / 4));
      lastDuration = Math.min(1.0, (last.actualDuration || last.duration * 60) / 3600);
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

  /**
   * Filters the available strategic arms based on the current context.
   * Ensures that a strategy is only suggested if there are tasks that match its criteria.
   *
   * @param ctx - The suggestion context.
   * @param lastTask - Optional pre-identified last completed task to avoid O(N) search.
   */
  private getValidStrategies(ctx: SuggestionContext, providedLastTask?: Task): number[] {
    const allActiveTasks = ctx.tasks;
    const activeTaskIds = ctx.activeTaskIds || new Set(allActiveTasks.map(t => t.id));
    const last = providedLastTask || ctx.lastTask || this.getLatestCompletedTask(ctx.completedTasks);

    const now = ctx.currentTime.getTime();
    const oneDayFromNow = now + 86400000;
    const fourteenDaysAgo = now - (14 * 24 * 60 * 60 * 1000);
    const hour = ctx.currentTime.getHours();

    // Strategy flags
    let hasDeepFlow = false;
    let hasQuickSpark = false;
    let hasMomentum = false;
    let hasPaletteCleanser = false;
    let hasCrusher = false;
    let hasLowGear = false;
    let hasArchaeologist = false;
    let hasSnowball = false;
    let hasTwilightRitual = false;
    let totalDuration = 0;

    // Bolt ⚡ Optimization: Single O(N) pass to identify all valid strategies and aggregate metrics.
    for (const task of allActiveTasks) {
        totalDuration += task.duration;

        // Check if blocked
        let isBlocked = false;
        if (task.blockedBy && task.blockedBy.length > 0) {
            for (const blockerId of task.blockedBy) {
                if (activeTaskIds.has(blockerId)) {
                    isBlocked = true;
                    break;
                }
            }
        }
        if (isBlocked) continue;

        // Strategy checks
        if (!hasDeepFlow && task.energy === 'High' && task.duration > 30) hasDeepFlow = true;
        if (!hasQuickSpark && task.energy === 'High' && task.duration <= 20) hasQuickSpark = true;
        if (last) {
            if (!hasMomentum && task.category === last.category) hasMomentum = true;
            if (!hasPaletteCleanser && task.category !== last.category) hasPaletteCleanser = true;
            if (!hasSnowball && last.duration <= 15 && task.duration <= 15) hasSnowball = true;
        }
        if (!hasCrusher && task.dueDate && task.dueDate < oneDayFromNow) hasCrusher = true;
        if (!hasLowGear && task.energy === 'Low') {
            hasLowGear = true;
            if (hour >= 17 && hour < 22) hasTwilightRitual = true;
        }
        if (!hasArchaeologist && task.createdAt < fourteenDaysAgo && !task.dueDate) hasArchaeologist = true;
    }

    const indices: number[] = [];
    if (hasDeepFlow) indices.push(StrategyArm.DEEP_FLOW);
    if (hasQuickSpark) indices.push(StrategyArm.QUICK_SPARK);
    if (hasMomentum) indices.push(StrategyArm.MOMENTUM);
    if (hasPaletteCleanser) indices.push(StrategyArm.PALETTE_CLEANSER);
    if (hasCrusher) indices.push(StrategyArm.THE_CRUSHER);
    if (hasLowGear) indices.push(StrategyArm.LOW_GEAR);

    indices.push(StrategyArm.SOMATIC_RESET);
    indices.push(StrategyArm.COGNITIVE_RESET);
    indices.push(StrategyArm.NO_OP);

    if (totalDuration > 180 || ctx.energy < 40) {
        indices.push(StrategyArm.PULL_BACK);
    }

    if (hasArchaeologist) indices.push(StrategyArm.ARCHAEOLOGIST);
    if (hasSnowball) indices.push(StrategyArm.SNOWBALL);
    if (hasTwilightRitual) indices.push(StrategyArm.TWILIGHT_RITUAL);

    return indices;
  }

  /**
   * Resolves a chosen strategic arm to a specific `Suggestion` object.
   * Filters tasks that meet the arm's criteria and picks the "best" one.
   *
   * @param arm - The index of the strategy arm.
   * @param ctx - The suggestion context.
   * @param lastTask - Optional pre-identified last completed task.
   */
  private resolveStrategy(arm: number, ctx: SuggestionContext, providedLastTask?: Task): Suggestion | null {
    const allActiveTasks = ctx.tasks;
    const activeTaskIds = ctx.activeTaskIds || new Set(allActiveTasks.map(t => t.id));
    const now = ctx.currentTime.getTime();
    const oneDayFromNow = now + 86400000;

    const isBlocked = (task: Task): boolean => {
        if (!task.blockedBy || task.blockedBy.length === 0) return false;
        return task.blockedBy.some(blockerId => activeTaskIds.has(blockerId));
    };
    let tasks = allActiveTasks.filter(t => !isBlocked(t));
    
    const last = providedLastTask || ctx.lastTask || (ctx.completedTasks.length > 0 ? this.getLatestCompletedTask(ctx.completedTasks) : null);
    let chosenTask: Task | null = null;
    let type: 'task' | 'wellbeing' = 'task';
    let reason = "";

    switch (arm) {
      case StrategyArm.DEEP_FLOW:
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
        tasks = tasks.filter(t => t.dueDate && t.dueDate < oneDayFromNow);
        // Bolt ⚡ Optimization: O(N) search instead of O(N log N) sort
        chosenTask = tasks.length > 0 ? tasks.reduce((prev, curr) => (curr.dueDate || 0) < (prev.dueDate || 0) ? curr : prev) : null;
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
        return null;

      case StrategyArm.PULL_BACK:
        type = 'wellbeing';
        reason = "Capacity Reached: Focus on current queue.";
        break;

      case StrategyArm.ARCHAEOLOGIST:
        const fourteenDaysAgo = now - (14 * 24 * 60 * 60 * 1000);
        tasks = tasks.filter(t => t.createdAt < fourteenDaysAgo && !t.dueDate);
        // Bolt ⚡ Optimization: O(N) search instead of O(N log N) sort
        chosenTask = tasks.length > 0 ? tasks.reduce((prev, curr) => curr.createdAt < prev.createdAt ? curr : prev) : null;
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
        id: crypto.randomUUID(),
        taskId: chosenTask.id,
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

  /**
   * Selects the most suitable task from a candidate list.
   * Prioritizes tasks by earliest due date, followed by most recent creation date.
   */
  private pickBest(tasks: Task[]): Task | null {
    if (tasks.length === 0) return null;
    
    let best = tasks[0];
    
    for (let i = 1; i < tasks.length; i++) {
        const current = tasks[i];
        
        if (current.dueDate && best.dueDate) {
            if (current.dueDate < best.dueDate) {
                best = current;
                continue;
            }
        } else if (current.dueDate && !best.dueDate) {
            best = current;
            continue;
        } else if (!current.dueDate && best.dueDate) {
            continue;
        }

        if (current.createdAt > best.createdAt) {
            best = current;
        }
    }
    
    return best;
  }

  /**
   * Internal helper to identify which strategies match an organic selection.
   * Returns a list of training samples (x, arm, reward).
   */
  private getOrganicSamples(task: Task, context: SuggestionContext, providedLastTask?: Task): { x: number[], arm: number, reward: number }[] {
    const last = providedLastTask || context.lastTask || this.getLatestCompletedTask(context.completedTasks);
    const validArms = this.getValidStrategies(context, last);
    const x = this.buildContextVector(context, last);
    const samples: { x: number[], arm: number, reward: number }[] = [];
    const now = context.currentTime.getTime();
    const oneDayFromNow = now + 86400000;
    const fourteenDaysAgo = now - (14 * 24 * 60 * 60 * 1000);

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
          matches = !!(task.dueDate && task.dueDate < oneDayFromNow);
          break;
        case StrategyArm.LOW_GEAR:
          matches = task.energy === 'Low';
          break;
        case StrategyArm.ARCHAEOLOGIST:
          matches = task.createdAt < fourteenDaysAgo && !task.dueDate;
          break;
        case StrategyArm.SNOWBALL:
          matches = !!last && last.duration <= 15 && task.duration <= 15;
          break;
        case StrategyArm.TWILIGHT_RITUAL:
          const h = context.currentTime.getHours();
          matches = h >= 17 && h < 22 && task.energy === 'Low';
          break;
        default:
          matches = false;
      }

      if (matches) {
        samples.push({ x, arm, reward: 1.0 });
      }
    }
    return samples;
  }

  /**
   * Feedback entry point for when a suggested strategy leads to a successful completion.
   */
  async logCompletion(ctx: SuggestionContext, strategyName: string, success: boolean) {
    const armIdx = ARM_NAMES.indexOf(strategyName);
    if (armIdx === -1) return;

    const x = this.buildContextVector(ctx);
    const reward = success ? 1.0 : -0.2;

    await LinUCBService.getInstance().update(x, armIdx, reward);
  }

  /**
   * Feedback entry point for when a suggestion is explicitly rejected or ignored by the user.
   */
  async logRejection(ctx: SuggestionContext, strategyName: string) {
    const armIdx = ARM_NAMES.indexOf(strategyName);
    if (armIdx === -1) return;

    const x = this.buildContextVector(ctx);
    const reward = -0.5;

    await LinUCBService.getInstance().update(x, armIdx, reward);
  }

  /**
   * Implementation of "Inverse Strategy Learning".
   * When a user manually selects a task, this function identifies all strategies
   * that *could* have suggested it and provides them with a positive reward.
   */
  async logOrganicSelection(task: Task, context: SuggestionContext) {
    const samples = this.getOrganicSamples(task, context);
    if (samples.length > 0) {
      await LinUCBService.getInstance().batchTrain(samples);
    }
  }

  /**
   * Finds the most recently completed task in a list.
   * Bolt ⚡ Optimization: O(N) single-pass traversal.
   */
  private getLatestCompletedTask(tasks: Task[]): Task | null {
    if (tasks.length === 0) return null;
    return tasks.reduce((latest, current) =>
      (current.completedAt || 0) > (latest.completedAt || 0) ? current : latest
    );
  }
}
