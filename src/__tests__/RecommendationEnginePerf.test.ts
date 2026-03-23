/** @jest-environment node */
import { RecommendationEngine } from '../services/RecommendationEngine';
import { TaskEntity, UserVital } from '@/types/scheduling';

// --- Mocks ---

// Mock Firebase services to avoid initialization errors
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  getApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  enableIndexedDbPersistence: jest.fn(() => Promise.resolve()),
  enableMultiTabIndexedDbPersistence: jest.fn(() => Promise.resolve()),
  doc: jest.fn(),
  setDoc: jest.fn(),
}));

// Mock LinUCBService to avoid database dependencies
jest.mock('../services/LinUCBService', () => {
  const original = jest.requireActual('../services/LinUCBService');
  return {
    ...original,
    LinUCBService: {
      getInstance: () => ({
        resetModel: jest.fn(),
        update: jest.fn(),
        batchTrain: jest.fn(),
      }),
    },
  };
});

describe('RecommendationEngine Performance', () => {
  it('should handle history recalibration efficiently', async () => {
    const engine = RecommendationEngine.getInstance();

    // Generate 1000 tasks
    const tasks: TaskEntity[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `task-${i}`,
      title: `Task ${i}`,
      status: 'completed',
      category: 'Work',
      duration: 30,
      energy: 'Medium',
      createdAt: Date.now() - (2000 * 60 * 1000),
      completedAt: Date.now() - (1000 * 60 * 1000) + (i * 1000), // Incremental completion
      actualDuration: 30 * 60
    } as TaskEntity));

    // Generate 500 vitals
    const vitals: UserVital[] = Array.from({ length: 500 }, (_, i) => ({
      id: `vital-${i}`,
      type: 'mood',
      value: 60,
      timestamp: Date.now() - (1500 * 60 * 1000) + (i * 2000),
      context: {} as never
    } as unknown as UserVital));

    const start = performance.now();
    await engine.recalibrateFromHistory(tasks, vitals);
    const end = performance.now();

    const duration = end - start;

    // O(N log N + N*A) should easily complete in under 500ms on a typical machine.
    expect(duration).toBeLessThan(500);
  });
});
