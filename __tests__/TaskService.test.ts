/** @jest-environment node */
import { TaskService } from '../services/TaskService';
import { db } from '../firebase';
import { ContextService } from '../services/ContextService';
import { doc, setDoc, updateDoc, deleteDoc, writeBatch, collection, addDoc } from 'firebase/firestore';
import { getNextRecurrenceDate } from '../utils/timeUtils';
import { TaskEntity, RecurrenceConfig } from '../types';
import crypto from 'crypto';

// --- Mocks ---

// Mock Firebase services
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  enableIndexedDbPersistence: jest.fn(() => Promise.resolve()),
  doc: jest.fn((db, path, ...pathSegments) => ({ path: [path, ...pathSegments].join('/') })),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  writeBatch: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
}));

// Mock ContextService to provide a consistent user ID
jest.mock('../services/ContextService', () => ({
  ContextService: {
    getInstance: () => ({
      getUserId: () => 'test-uid',
      getSnapshot: jest.fn().mockResolvedValue({}), // For logSessionCompletion
    }),
  },
}));

// Mock timeUtils for predictable recurrence
jest.mock('../utils/timeUtils', () => ({
  ...jest.requireActual('../utils/timeUtils'), // Keep other functions real
  getNextRecurrenceDate: jest.fn(),
}));

// Mock Date.now() for consistent timestamps
const MOCK_NOW = new Date('2024-01-01T12:00:00Z').getTime();
jest.spyOn(Date, 'now').mockReturnValue(MOCK_NOW);

// --- Test Suite ---

describe('TaskService', () => {
  let taskService: TaskService;
  const mockBatch = {
    update: jest.fn(),
    set: jest.fn(),
    commit: jest.fn(),
  };

  beforeEach(() => {
    // Reset all mock implementations and calls first
    jest.clearAllMocks();

    // Set up mocks for this test scope
    jest.spyOn(crypto, 'randomUUID').mockReturnValue('mock-uuid');
    (writeBatch as jest.Mock).mockReturnValue(mockBatch);

    // Get a fresh instance for each test
    taskService = TaskService.getInstance();
  });

  // Test addTask
  describe('addTask', () => {
    it('should create a new task with correct defaults', async () => {
      await taskService.addTask('Test Task', 'Work', 30, 80, 'notes', undefined, undefined, undefined);

      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(), // doc ref
        expect.objectContaining({
          id: 'mock-uuid',
          title: 'Test Task',
          category: 'Work',
          duration: 30,
          energy: 'High', // 80 should map to High
          status: 'active',
          notes: 'notes',
          dueDate: null,
          assignedDate: null,
          recurrence: null,
          createdAt: MOCK_NOW,
          updatedAt: MOCK_NOW,
        })
      );
    });
  });

  // Test updateTask
  describe('updateTask', () => {
    it('should update a task with the provided data and timestamp', async () => {
      await taskService.updateTask('task-1', { title: 'Updated Title' });
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        {
          title: 'Updated Title',
          updatedAt: MOCK_NOW,
        }
      );
    });
  });

  // Test state changes
  describe('state transitions', () => {
    it('should archive a task', async () => {
      const updateSpy = jest.spyOn(taskService, 'updateTask');
      await taskService.archiveTask('task-1');
      expect(updateSpy).toHaveBeenCalledWith('task-1', {
        status: 'archived',
        isFocused: false,
        archivedAt: MOCK_NOW,
        remainingSeconds: null,
        lastStartedAt: null,
      });
      updateSpy.mockRestore();
    });

    it('should unarchive a task', async () => {
      const updateSpy = jest.spyOn(taskService, 'updateTask');
      await taskService.unarchiveTask('task-1');
      expect(updateSpy).toHaveBeenCalledWith('task-1', {
        status: 'active',
        archivedAt: null,
      });
      updateSpy.mockRestore();
    });
  });
  
  // Test deleteTask
  describe('deleteTask', () => {
      it('should delete the specified task document', async () => {
          await taskService.deleteTask('task-to-delete');
          expect(deleteDoc).toHaveBeenCalledWith(doc(db, 'users', 'test-uid', 'tasks', 'task-to-delete'));
      });
  });


  // Test completeTask
  describe('completeTask', () => {
    const mockTask: TaskEntity = {
      id: 'task-1',
      title: 'A regular task',
      status: 'active',
      duration: 30,
      energy: 'Medium',
      category: 'Work',
      createdAt: MOCK_NOW - 1000,
    } as TaskEntity;

    it('should complete a non-recurring task', async () => {
      const nextDate = await taskService.completeTask(mockTask, 1700, []);

      expect(mockBatch.update).toHaveBeenCalledWith(
        expect.anything(), // doc ref
        expect.objectContaining({
          status: 'completed',
          completedAt: MOCK_NOW,
          actualDuration: 1700,
          isFocused: false,
          remainingSeconds: null,
          lastStartedAt: null
        })
      );
      expect(mockBatch.set).not.toHaveBeenCalled(); // No new task created
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
      expect(nextDate).toBeNull();
    });

    it('should complete a recurring task and create the next instance', async () => {
      const recurringTask: TaskEntity = {
        ...mockTask,
        id: 'task-recur',
        dueDate: MOCK_NOW,
        recurrence: { frequency: 'daily', interval: 1 },
      };
      
      const MOCK_NEXT_DATE = new Date('2024-01-02T12:00:00Z').getTime();
      (getNextRecurrenceDate as jest.Mock).mockReturnValue(MOCK_NEXT_DATE);

      const nextDate = await taskService.completeTask(recurringTask, 1800, []);

      // 1. Verify original task is completed
      expect(mockBatch.update).toHaveBeenCalledWith(
        doc(db, 'users', 'test-uid', 'tasks', 'task-recur'),
        expect.objectContaining({ status: 'completed', completedAt: MOCK_NOW })
      );

      // 2. Verify new task is created
      expect(mockBatch.set).toHaveBeenCalledWith(
        expect.anything(), // new doc ref
        expect.objectContaining({
          title: 'A regular task',
          status: 'active',
          dueDate: MOCK_NEXT_DATE, // The new due date
          assignedDate: null,
          completedAt: null,
          isFocused: false
        })
      );
      
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
      expect(nextDate).toBe(MOCK_NEXT_DATE);
    });

    it('should update the duration for a completed quick focus (unplanned) task', async () => {
        const quickFocusTask: TaskEntity = {
          ...mockTask,
          id: 'task-quick-focus',
          duration: 0, // This is an unplanned task
        };
        
        const actualSecondsSpent = 1200; // User focused for 20 minutes
  
        await taskService.completeTask(quickFocusTask, actualSecondsSpent, []);
  
        // Verify original task is updated
        expect(mockBatch.update).toHaveBeenCalledWith(
          doc(db, 'users', 'test-uid', 'tasks', 'task-quick-focus'),
          expect.objectContaining({
            status: 'completed',
            completedAt: MOCK_NOW,
            actualDuration: actualSecondsSpent,
            duration: 20 // CRITICAL: 1200 seconds should be saved as 20 minutes
          })
        );
        
        expect(mockBatch.commit).toHaveBeenCalledTimes(1);
      });
      
    it('should unlock dependent tasks upon completion', async () => {
        const blockerTask: TaskEntity = {
            id: 'task-blocker',
            title: 'Do this first',
            status: 'active',
        } as TaskEntity;

        const dependentTask: TaskEntity = {
            id: 'task-dependent',
            title: 'Do this after',
            status: 'active',
            blockedBy: ['task-blocker'],
        } as TaskEntity;
        
        const allActiveTasks = [blockerTask, dependentTask];

        // Action: Complete the blocker task
        await taskService.completeTask(blockerTask, 1800, allActiveTasks);

        // 1. Verify the original task is marked as completed
        expect(mockBatch.update).toHaveBeenCalledWith(
            doc(db, 'users', 'test-uid', 'tasks', 'task-blocker'),
            expect.objectContaining({ status: 'completed' })
        );

        // 2. Verify the dependent task is "unlocked" by removing the ID from its blockedBy array
        expect(mockBatch.update).toHaveBeenCalledWith(
            doc(db, 'users', 'test-uid', 'tasks', 'task-dependent'),
            { blockedBy: [] }
        );

        // 3. Verify the batch commit was called
        expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });
  });
  
  // Test Focus Session methods
  describe('Focus Sessions', () => {
    it('should start a session correctly', async () => {
      const updateSpy = jest.spyOn(taskService, 'updateTask');
      await taskService.startSession('task-focus', 1500);
      expect(updateSpy).toHaveBeenCalledWith('task-focus', {
        remainingSeconds: 1500,
        lastStartedAt: MOCK_NOW,
        isFocused: true,
      });
      updateSpy.mockRestore();
    });

    it('should pause a session correctly', async () => {
      const updateSpy = jest.spyOn(taskService, 'updateTask');
      await taskService.pauseSession('task-focus', 900);
      expect(updateSpy).toHaveBeenCalledWith('task-focus', {
        remainingSeconds: 900,
        lastStartedAt: null,
      });
      updateSpy.mockRestore();
    });
  });

  // Test logSessionCompletion
  describe('logSessionCompletion', () => {
    it('should update task and log activity and vitals', async () => {
      const updateSpy = jest.spyOn(taskService, 'updateTask');
      const mockTask: TaskEntity = { id: 'task-log', title: 'Test', category: 'Work', duration: 30, energy: 'Medium', status: 'active', createdAt: 1 } as TaskEntity;
      
      await taskService.logSessionCompletion(mockTask, 'Energized', 'Great session!', 85);

      // Updates completion notes on the task itself
      expect(updateSpy).toHaveBeenCalledWith('task-log', {
        completionMood: 'Energized',
        completionNotes: 'Great session!',
      });
      updateSpy.mockRestore();

      // Creates an activity log entry
      expect(addDoc).toHaveBeenCalledWith(
        collection(db, 'users', 'test-uid', 'activityLogs'),
        expect.objectContaining({
          type: 'task_complete',
          data: {
            taskId: 'task-log',
            userMood: 'Energized',
            notes: 'Great session!',
            energyResult: 85
          }
        })
      );
      
      // Creates a new 'mood' vital
      expect(setDoc).toHaveBeenCalledWith(
        doc(db, 'users', 'test-uid', 'vitals', 'mock-uuid'),
        expect.objectContaining({
          type: 'mood',
          value: 85,
          metadata: {
            source: 'session_completion',
            taskId: 'task-log',
            mood: 'Energized'
          }
        })
      );
    });
  });

});
