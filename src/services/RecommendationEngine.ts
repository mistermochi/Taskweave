import { TaskEntity, Category, SuggestionContext, Suggestion, UserVital } from "@/types/scheduling";
import { LinUCBService, StrategyArm, ARM_NAMES } from "./LinUCBService";
import { AIService } from "./AIService";
import { AIPromptBuilder } from "./AIPromptBuilder";
import { normalizeEnergy } from "@/utils/energyUtils";

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
  async calibrate(tasks: TaskEntity[]): Promise<number> {
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
                completedAt: mockDate.getTime() - (15 * 60000),
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
   */
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
    
    for (const task of completedTasks) {
      const completionTime = task.completedAt!;
      
      let energyAtTime = 75;
      const priorVital = sortedVitals.findLast(v => v.timestamp < completionTime);
      if (priorVital) {
        energyAtTime = normalizeEnergy(priorVital.value as number);
      }

      const previousCompletions = completedTasks.filter(t => t.completedAt! < completionTime);
      
      const activeTasksAtTime = allTasks.filter(t => {
        if (t.id === task.id) return false;
        if (t.createdAt > completionTime) return false;
        if (t.completedAt && t.completedAt < completionTime) return false;
        if (t.archivedAt && t.archivedAt < completionTime) return false;
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

  /**
   * Generates a personalized recommendation by querying the LinUCB bandit model.
   *
   * @param context - The current user and application context.
   * @returns A promise resolving to the generated `Suggestion` and the name of the chosen strategy.
   */
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

  /**
   * Transforms the complex `SuggestionContext` into a fixed-length numeric vector (d=11).
   * This vector is the input for the LinUCB machine learning model.
   *
   * @param ctx - The suggestion context.
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
  public buildContextVector(ctx: SuggestionContext): number[] {
    const bias = 1.0;
    const hour = ctx.currentTime.getHours() / 24;
    const energy = ctx.energy / 100;
    const totalDuration = ctx.tasks.reduce((sum, t) => sum + t.duration, 0);
    const queuePressure = Math.min(1.0, totalDuration / 480);
    const urgentCount = ctx.tasks.filter(t => t.dueDate && t.dueDate < Date.now() + 86400000).length;
    const urgencyRatio = ctx.tasks.length > 0 ? urgentCount / ctx.tasks.length : 0;

    let timeSinceLast = 1.0;
    let lastDuration = 0;
    let lastCats = [0, 0, 0, 0];

    if (ctx.completedTasks.length > 0) {
      const last = ctx.completedTasks.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))[0];
      const msSince = Date.now() - (last.completedAt || 0);
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
   */
  private getValidStrategies(ctx: SuggestionContext): number[] {
    const allActiveTasks = ctx.tasks;
    const isBlocked = (task: TaskEntity): boolean => {
        if (!task.blockedBy || task.blockedBy.length === 0) return false;
        return task.blockedBy.some(blockerId => allActiveTasks.some(t => t.id === blockerId));
    };
    const t = allActiveTasks.filter(t => !isBlocked(t));

    const indices: number[] = [];
    const last = ctx.completedTasks.length > 0 
        ? [...ctx.completedTasks].sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))[0] 
        : null;
    const hour = ctx.currentTime.getHours();

    if (t.some(x => x.energy === 'High' && x.duration > 30)) indices.push(StrategyArm.DEEP_FLOW);
    if (t.some(x => x.energy === 'High' && x.duration <= 20)) indices.push(StrategyArm.QUICK_SPARK);
    if (last && t.some(x => x.category === last.category)) indices.push(StrategyArm.MOMENTUM);
    if (last && t.some(x => x.category !== last.category)) indices.push(StrategyArm.PALETTE_CLEANSER);
    if (t.some(x => x.dueDate && x.dueDate < Date.now() + 86400000)) indices.push(StrategyArm.THE_CRUSHER);
    if (t.some(x => x.energy === 'Low')) indices.push(StrategyArm.LOW_GEAR);

    indices.push(StrategyArm.SOMATIC_RESET);
    indices.push(StrategyArm.COGNITIVE_RESET);
    indices.push(StrategyArm.NO_OP);

    const totalDuration = ctx.tasks.reduce((sum, task) => sum + task.duration, 0);
    if (totalDuration > 180 || ctx.energy < 40) {
        indices.push(StrategyArm.PULL_BACK);
    }

    const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
    if (t.some(x => x.createdAt < fourteenDaysAgo && !x.dueDate)) {
        indices.push(StrategyArm.ARCHAEOLOGIST);
    }

    if (last && last.duration <= 15 && t.some(x => x.duration <= 15)) {
        indices.push(StrategyArm.SNOWBALL);
    }

    if (hour >= 17 && hour < 22 && t.some(x => x.energy === 'Low')) {
        indices.push(StrategyArm.TWILIGHT_RITUAL);
    }

    return indices;
  }

  /**
   * Resolves a chosen strategic arm to a specific `Suggestion` object.
   * Filters tasks that meet the arm's criteria and picks the "best" one.
   */
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
        return null;

      case StrategyArm.PULL_BACK:
        type = 'wellbeing';
        reason = "Capacity Reached: Focus on current queue.";
        break;

      case StrategyArm.ARCHAEOLOGIST:
        const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
        tasks = tasks.filter(t => t.createdAt < fourteenDaysAgo && !t.dueDate);
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
  private pickBest(tasks: TaskEntity[]): TaskEntity | null {
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
  async logOrganicSelection(task: TaskEntity, context: SuggestionContext) {
    const validArms = this.getValidStrategies(context);
    const x = this.buildContextVector(context);
    const last = context.completedTasks.length > 0 
        ? [...context.completedTasks].sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))[0] 
        : null;

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
        default:
          matches = false;
      }

      if (matches) {
         await LinUCBService.getInstance().update(x, arm, 1.0);
      }
    }
  }
}
