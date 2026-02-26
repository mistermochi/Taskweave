import { Matrix } from "../utils/math";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

/**
 * The 13 Strategic Arms (Categories of Recommendations).
 * Each arm represents a different heuristic or strategy for choosing a task.
 */
export enum StrategyArm {
  /** High energy required, long duration task. */
  DEEP_FLOW = 0,
  /** High energy required, short duration task. */
  QUICK_SPARK = 1,
  /** Same category as the most recently completed task. */
  MOMENTUM = 2,
  /** different category from the last task to prevent burnout. */
  PALETTE_CLEANSER = 3,
  /** Task with the nearest due date. */
  THE_CRUSHER = 4,
  /** Low energy task. */
  LOW_GEAR = 5,
  /** Physical movement or hydration. */
  SOMATIC_RESET = 6,
  /** Meditation or breathing exercise. */
  COGNITIVE_RESET = 7,
  /** No recommendation provided. */
  NO_OP = 8,
  /** Suggesting against starting new work (e.g., if overloaded). */
  PULL_BACK = 9,
  /** Old tasks (>14 days) without deadlines. */
  ARCHAEOLOGIST = 10,
  /** Multiple small tasks in a row. */
  SNOWBALL = 11,
  /** Winding down with low-effort tasks in the evening. */
  TWILIGHT_RITUAL = 12
}

/** Human-readable names for the strategy arms. */
export const ARM_NAMES = [
  "Deep Flow", "Quick Spark", "Momentum", "Palette Cleanser",
  "The Crusher", "Low Gear", "Somatic Reset", "Cognitive Reset",
  "Status Quo", "Pull Back", "The Archaeologist", "Snowball", "Twilight Ritual"
];

const NUM_ARMS = 13;
const NUM_FEATURES = 11;
const ALPHA = 0.5;

/**
 * Parameters for a single arm in the LinUCB model.
 */
interface ArmParams {
  /** d x d matrix (where d = NUM_FEATURES). */
  A: number[][];
  /** d-dimensional vector. */
  b: number[];
}

/**
 * Service implementing the LinUCB (Linear Upper Confidence Bound) Multi-Armed Bandit algorithm.
 * This is the core machine learning engine that personalizes task suggestions
 * by learning from user feedback and context.
 *
 * @singleton Use `LinUCBService.getInstance()` to access the service.
 */
export class LinUCBService {
  /** Singleton instance of the service. */
  private static instance: LinUCBService;
  /** Parameters for all available strategy arms. */
  private arms: ArmParams[] = [];
  /** Internal flag for lazy-loading status. */
  private isInitialized = false;
  /** Current user ID for database persistence. */
  private userId: string | null = null;
  /** Internal promise to handle concurrent load requests. */
  private loadPromise: Promise<void> | null = null;

  /**
   * Private constructor initializing the base model.
   */
  private constructor() {
    this.resetModel();
  }

  /**
   * Returns the singleton instance of LinUCBService.
   * @returns The LinUCBService instance.
   */
  static getInstance(): LinUCBService {
    if (!this.instance) this.instance = new LinUCBService();
    return this.instance;
  }

  /**
   * Sets the user ID and triggers a reload of that user's specific model parameters.
   */
  setUserId(uid: string) {
    if (this.userId !== uid) {
      this.userId = uid;
      this.isInitialized = false;
      this.loadPromise = null;
    }
  }

  /**
   * Initializes or resets the model to its default state (identity matrices).
   */
  public resetModel() {
    this.arms = [];
    for (let i = 0; i < NUM_ARMS; i++) {
      this.arms.push({
        A: Matrix.identity(NUM_FEATURES),
        b: new Array(NUM_FEATURES).fill(0)
      });
    }
    this.isInitialized = true;
  }

  /**
   * Predicts the best strategy arm to suggest given a context vector.
   *
   * @param x - The context feature vector (dimension d=11).
   * @param validArms - Subset of indices to consider (masking).
   * @returns A promise resolving to the chosen arm index and its UCB score.
   *
   * @logic
   * - Calculates the expected mean reward using Ridge Regression.
   * - Calculates the confidence bound based on the model's uncertainty.
   * - Selects the arm that maximizes (Expected Mean + Alpha * Confidence Bound).
   */
  async predict(x: number[], validArms: number[]): Promise<{ arm: number; score: number }> {
    if (!this.isInitialized && this.userId) {
       if (!this.loadPromise) {
           this.loadPromise = this.loadModel();
       }
       await this.loadPromise;
    }

    if (validArms.length === 0) return { arm: -1, score: -Infinity };

    let bestArm = -1;
    let maxUCB = -Infinity;

    for (const armIdx of validArms) {
      if (!this.arms[armIdx]) continue;

      try {
          const { A, b } = this.arms[armIdx];
          
          const A_inv = Matrix.invert(A);
          const theta = Matrix.dot(A_inv, b);
          const p = Matrix.vectorDot(theta, x);
          const variance = Matrix.vectorDot(x, Matrix.dot(A_inv, x));
          const safeVariance = Math.max(0, variance);
          const cb = ALPHA * Math.sqrt(safeVariance);
          
          const ucb = p + cb;

          if (ucb > maxUCB) {
            maxUCB = ucb;
            bestArm = armIdx;
          }
      } catch (e) {
          console.warn(`LinUCB Math Error on Arm ${armIdx}`, e);
          continue;
      }
    }

    if (bestArm === -1 && validArms.length > 0) {
        return { arm: validArms[0], score: 0 };
    }

    return { arm: bestArm, score: maxUCB };
  }

  /**
   * Updates the model parameters for a specific arm based on a reward signal.
   *
   * @param x - The context vector used for the prediction.
   * @param armIdx - The index of the chosen arm.
   * @param reward - The observed reward (e.g., 1.0 for completion, -0.5 for rejection).
   */
  async update(x: number[], armIdx: number, reward: number) {
    if (armIdx < 0 || armIdx >= NUM_ARMS) return;

    if (!this.isInitialized && this.userId) {
         if (!this.loadPromise) this.loadPromise = this.loadModel();
         await this.loadPromise;
    }

    const { A, b } = this.arms[armIdx];

    const outer = Matrix.outerProduct(x);
    this.arms[armIdx].A = Matrix.add(A, outer);

    const weightedX = Matrix.scale(x, reward);
    this.arms[armIdx].b = Matrix.vecAdd(b, weightedX);

    await this.saveModel();
  }

  /**
   * Performs batch training on multiple context-arm-reward samples.
   * Used for calibration and historical re-training.
   */
  async batchTrain(samples: { x: number[], arm: number, reward: number }[]) {
    if (!this.isInitialized && this.userId) {
         if (!this.loadPromise) this.loadPromise = this.loadModel();
         await this.loadPromise;
    }

    for (const { x, arm, reward } of samples) {
        if (arm < 0 || arm >= NUM_ARMS) continue;
        
        const { A, b } = this.arms[arm];
        const outer = Matrix.outerProduct(x);
        this.arms[arm].A = Matrix.add(A, outer);
        const weightedX = Matrix.scale(x, reward);
        this.arms[arm].b = Matrix.vecAdd(b, weightedX);
    }

    await this.saveModel();
  }

  /**
   * Persists the model parameters to Firestore.
   */
  private async saveModel() {
    if (!this.userId) return;
    try {
      const serialized = this.arms.map(arm => ({
        A: arm.A.flat(),
        b: arm.b
      }));
      await setDoc(doc(db, `users/${this.userId}/models/linucb`), { 
        data: serialized,
        updatedAt: Date.now(),
        version: 1,
        features: NUM_FEATURES
      });
    } catch (e) {
      console.error("Failed to save LinUCB model", e);
    }
  }

  /**
   * Loads the model parameters from Firestore.
   */
  private async loadModel() {
    if (!this.userId) return;
    try {
      const snap = await getDoc(doc(db, `users/${this.userId}/models/linucb`));
      if (snap.exists()) {
        const docData = snap.data();
        const raw = docData.data;
        const storedFeatures = docData.features || 0;

        if (storedFeatures !== NUM_FEATURES) {
            console.warn("LinUCB dimension mismatch. Resetting model.");
            this.resetModel();
            return;
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const loadedArms = raw.map((r: any) => ({
          A: this.unflatten(r.A, NUM_FEATURES),
          b: r.b
        }));

        if (loadedArms.length < NUM_ARMS) {
           const missingCount = NUM_ARMS - loadedArms.length;
           for (let i = 0; i < missingCount; i++) {
             loadedArms.push({
               A: Matrix.identity(NUM_FEATURES),
               b: new Array(NUM_FEATURES).fill(0)
             });
           }
        }

        this.arms = loadedArms;
        this.isInitialized = true;
      } else {
        this.resetModel();
      }
    } catch (e) {
      console.warn("Failed to load LinUCB model, using default", e);
      this.resetModel();
    }
  }

  /**
   * Converts a flat array back into a square matrix.
   */
  private unflatten(arr: number[], size: number): number[][] {
    const res = [];
    for (let i = 0; i < size; i++) {
      res.push(arr.slice(i * size, (i + 1) * size));
    }
    return res;
  }
}
