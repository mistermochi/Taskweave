

import { Matrix } from "../utils/math";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// The 13 Strategic Arms
export enum StrategyArm {
  DEEP_FLOW = 0,      // High Energy, >30m
  QUICK_SPARK = 1,    // High Energy, <20m
  MOMENTUM = 2,       // Same Category as Last
  PALETTE_CLEANSER = 3, // Diff Category as Last
  THE_CRUSHER = 4,    // Nearest Due Date
  LOW_GEAR = 5,       // Low Energy
  SOMATIC_RESET = 6,  // Physical Wellbeing
  COGNITIVE_RESET = 7, // Mental Wellbeing
  NO_OP = 8,          // No Recommendation (Status Quo)
  PULL_BACK = 9,      // Recommend Against (Capacity Warning)
  ARCHAEOLOGIST = 10, // Stale tasks > 14 days
  SNOWBALL = 11,      // Velocity Batching (Small after Small)
  TWILIGHT_RITUAL = 12 // Low Energy in Evening
}

export const ARM_NAMES = [
  "Deep Flow", "Quick Spark", "Momentum", "Palette Cleanser",
  "The Crusher", "Low Gear", "Somatic Reset", "Cognitive Reset",
  "Status Quo", "Pull Back", "The Archaeologist", "Snowball", "Twilight Ritual"
];

const NUM_ARMS = 13;
const NUM_FEATURES = 11; // Context Dimension
const ALPHA = 0.5; // Exploration parameter

interface ArmParams {
  A: number[][]; // d*d matrix
  b: number[];   // d vector
}

export class LinUCBService {
  private static instance: LinUCBService;
  private arms: ArmParams[] = [];
  private isInitialized = false;
  private userId: string | null = null;
  private loadPromise: Promise<void> | null = null;

  private constructor() {
    this.resetModel();
  }

  static getInstance(): LinUCBService {
    if (!this.instance) this.instance = new LinUCBService();
    return this.instance;
  }

  setUserId(uid: string) {
    if (this.userId !== uid) {
      this.userId = uid;
      this.isInitialized = false;
      this.loadPromise = null;
      // We don't immediately load here, strictly lazy load on predict to save bandwidth
    }
  }

  // Initialize empty model (Identity matrices)
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

  // Predict best arm given context vector x
  // validArms: Indices of arms that are actually possible (masking)
  async predict(x: number[], validArms: number[]): Promise<{ arm: number; score: number }> {
    // 1. Ensure Model is Loaded (Concurrency Safe)
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
      // Safety check in case validArms contains index out of bounds
      if (!this.arms[armIdx]) continue;

      try {
          const { A, b } = this.arms[armIdx];
          
          // Ridge Regression: theta = A^-1 * b
          // GUARD: Matrix inversion can fail if singular
          const A_inv = Matrix.invert(A);
          const theta = Matrix.dot(A_inv, b); // Result is vector (d)
          
          // Expected Mean: p = theta^T * x
          const p = Matrix.vectorDot(theta, x);
          
          // Confidence Interval: alpha * sqrt(x^T * A^-1 * x)
          const variance = Matrix.vectorDot(x, Matrix.dot(A_inv, x));
          
          // Guard against negative variance due to floating point drift
          const safeVariance = Math.max(0, variance);
          const cb = ALPHA * Math.sqrt(safeVariance);
          
          const ucb = p + cb;

          if (ucb > maxUCB) {
            maxUCB = ucb;
            bestArm = armIdx;
          }
      } catch (e) {
          console.warn(`LinUCB Math Error on Arm ${armIdx}`, e);
          // If math fails for this arm, skip it (treat score as -Infinity)
          continue;
      }
    }

    // Fallback: If all calculations failed (rare), pick the first valid arm
    if (bestArm === -1 && validArms.length > 0) {
        return { arm: validArms[0], score: 0 };
    }

    return { arm: bestArm, score: maxUCB };
  }

  // Update model with outcome
  // r: Reward (0.0 to 1.0)
  async update(x: number[], armIdx: number, reward: number) {
    if (armIdx < 0 || armIdx >= NUM_ARMS) return;

    // Ensure initialization before update
    if (!this.isInitialized && this.userId) {
         if (!this.loadPromise) this.loadPromise = this.loadModel();
         await this.loadPromise;
    }

    const { A, b } = this.arms[armIdx];

    // A = A + x * x^T
    const outer = Matrix.outerProduct(x);
    this.arms[armIdx].A = Matrix.add(A, outer);

    // b = b + r * x
    const weightedX = Matrix.scale(x, reward);
    this.arms[armIdx].b = Matrix.vecAdd(b, weightedX);

    // Persist (Debounced in real app, immediate here for simplicity)
    await this.saveModel();
  }

  // Batch Update for Offline Training / Calibration
  async batchTrain(samples: { x: number[], arm: number, reward: number }[]) {
    // Ensure initialization before update
    if (!this.isInitialized && this.userId) {
         if (!this.loadPromise) this.loadPromise = this.loadModel();
         await this.loadPromise;
    }

    // Update in-memory model for all samples
    for (const { x, arm, reward } of samples) {
        if (arm < 0 || arm >= NUM_ARMS) continue;
        
        const { A, b } = this.arms[arm];
        
        // A = A + x * x^T
        const outer = Matrix.outerProduct(x);
        this.arms[arm].A = Matrix.add(A, outer);

        // b = b + r * x
        const weightedX = Matrix.scale(x, reward);
        this.arms[arm].b = Matrix.vecAdd(b, weightedX);
    }

    // Save once at the end
    await this.saveModel();
  }

  // --- Persistence ---

  private async saveModel() {
    if (!this.userId) return;
    try {
      // Flatten for storage
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

  private async loadModel() {
    if (!this.userId) return;
    try {
      const snap = await getDoc(doc(db, `users/${this.userId}/models/linucb`));
      if (snap.exists()) {
        const docData = snap.data();
        const raw = docData.data;
        const storedFeatures = docData.features || 0;

        // Validation: If feature dimensions changed, we must reset to avoid math errors
        if (storedFeatures !== NUM_FEATURES) {
            console.warn("LinUCB dimension mismatch. Resetting model.");
            this.resetModel();
            return;
        }
        
        // Map loaded data
        const loadedArms = raw.map((r: any) => ({
          A: this.unflatten(r.A, NUM_FEATURES),
          b: r.b
        }));

        // Migration Check: If we added new arms since last save, pad the array
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
        this.resetModel(); // New user
      }
    } catch (e) {
      console.warn("Failed to load LinUCB model, using default", e);
      this.resetModel();
    }
  }

  private unflatten(arr: number[], size: number): number[][] {
    const res = [];
    for (let i = 0; i < size; i++) {
      res.push(arr.slice(i * size, (i + 1) * size));
    }
    return res;
  }
}
