import { db } from '@/shared/api/firebase';
import { getDoc, doc, updateDoc, deleteDoc, setDoc, writeBatch, collection, addDoc } from 'firebase/firestore';
import { Task, TaskEntity, EnergyLevel, RecurrenceConfig } from '../model/types';
import { Category } from '@/entities/tag';
import { contextApi } from '@/entities/context';
import { getNextRecurrenceDate, calculateTaskTime } from '@/shared/lib/timeUtils';

/**
 * Service for managing the lifecycle of tasks in Firestore.
 * Handles CRUD operations, status changes, recurring task logic,
 * dependency management, and focus session persistence.
 *
 * @singleton Use `taskApi` to access the service.
 */
export class TaskApi {
    /** Singleton instance of the service. */
    private static instance: TaskApi;

    /**
     * Private constructor for singleton pattern.
     */
    private constructor() { }

    /**
     * Returns the singleton instance of TaskApi.
     * @returns The TaskApi instance.
     */
    public static getInstance(): TaskApi {
        if (!TaskApi.instance) {
            TaskApi.instance = new TaskApi();
        }
        return TaskApi.instance;
    }

    /**
     * Creates a new task and persists it to Firestore.
     *
     * @param title - The title of the task.
     * @param category - The ID of the associated tag.
     * @param duration - Estimated duration in minutes.
     * @param energy - Numeric energy value (will be normalized to High/Medium/Low).
     * @param notes - Optional descriptive notes.
     * @param dueDate - Unix timestamp for the task deadline.
     * @param assignedDate - Unix timestamp for when the task is scheduled to be done.
     * @param recurrence - Optional configuration for repeating tasks.
     * @returns A promise resolving to the ID of the newly created task.
     */
    public async addTask(
        title: string,
        category: Category,
        duration: number,
        energy: number,
        notes: string,
        dueDate: number | undefined,
        assignedDate: number | undefined,
        recurrence?: RecurrenceConfig
    ): Promise<string> {
        const uid = contextApi.getUserId();
        if (!uid || !title.trim()) return "";

        const energyLevel: EnergyLevel = energy > 75 ? 'High' : energy < 40 ? 'Low' : 'Medium';
        const finalDuration = duration === 0 ? 0 : Math.max(1, Math.min(240, duration));
        const sanitizedRecurrence = recurrence ? JSON.parse(JSON.stringify(recurrence)) : null;

        const taskData: Omit<TaskEntity, 'id' | 'createdAt' | 'updatedAt'> = {
            title,
            category,
            duration: finalDuration,
            energy: energyLevel,
            status: 'active',
            notes,
            dueDate: dueDate || null,
            assignedDate: assignedDate || null,
            recurrence: sanitizedRecurrence,
            isFocused: false,
            remainingSeconds: null,
            lastStartedAt: null,
            archivedAt: null,
            completedAt: null,
            actualDuration: null,
            completionMood: null,
            completionNotes: null,
            blockedBy: [],
        };
        
        const newTaskId = crypto.randomUUID();
        const taskRef = doc(db, 'users', uid, 'tasks', newTaskId);
        const now = Date.now();

        await setDoc(taskRef, {
            ...taskData,
            id: newTaskId,
            createdAt: now,
            updatedAt: now,
        });

        return newTaskId;
    }

    /**
     * Updates an existing task with new field values.
     *
     * @param taskId - The unique ID of the task to update.
     * @param updates - Partial object containing the fields to update.
     */
    public async updateTask(taskId: string, updates: Partial<TaskEntity>): Promise<void> {
        const uid = contextApi.getUserId();
        if (!uid) return;

        const taskRef = doc(db, 'users', uid, 'tasks', taskId);
        const cleanUpdates = JSON.parse(JSON.stringify(updates));
        await updateDoc(taskRef, {
            ...cleanUpdates,
            updatedAt: Date.now()
        });
    }

    /**
     * Archives a task, marking it as inactive and clearing focus/timer state.
     * @param taskId - The ID of the task to archive.
     */
    public async archiveTask(taskId: string): Promise<void> {
        await this.updateTask(taskId, {
            status: 'archived',
            isFocused: false,
            archivedAt: Date.now(),
            remainingSeconds: null,
            lastStartedAt: null
        });
    }

    /**
     * Restores a task from the archive to an active state.
     * @param taskId - The ID of the task to restore.
     */
    public async unarchiveTask(taskId: string): Promise<void> {
        await this.updateTask(taskId, {
            status: 'active',
            archivedAt: null
        });
    }
    
    /**
     * Reverts a completed task back to an active state.
     * @param taskId - The ID of the task to re-activate.
     */
    public async uncompleteTask(taskId: string): Promise<void> {
        const uid = contextApi.getUserId();
        if (!uid) return;

        const taskRef = doc(db, 'users', uid, 'tasks', taskId);
        await updateDoc(taskRef, {
            status: 'active',
            completedAt: null,
            updatedAt: Date.now()
        });
    }

    /**
     * Permanently deletes a task from Firestore.
     * @param taskId - The ID of the task to delete.
     */
    public async deleteTask(taskId: string): Promise<void> {
        const uid = contextApi.getUserId();
        if (!uid) return;
        const taskRef = doc(db, 'users', uid, 'tasks', taskId);
        await deleteDoc(taskRef);
    }

    /**
     * Finalizes a task session by marking it complete and potentially spawning a new recurring instance.
     *
     * @param task - The task entity being completed.
     * @param actualSeconds - The total time spent in seconds.
     * @param allActiveTasks - The current list of all active tasks (used for dependency unlocking).
     * @returns A promise resolving to the due date of the next recurring instance, if applicable.
     *
     * @logic
     * - Calculates the next occurrence if the task has a `recurrence` config.
     * - Delegates to `completeTaskAndRespawn` for the atomic batch operation.
     */
    public async completeTask(task: TaskEntity, actualSeconds: number, allActiveTasks: TaskEntity[]): Promise<number | null> {
        if (!task) return null;

        let nextTaskData: Omit<TaskEntity, 'id' | 'createdAt' | 'updatedAt'> | undefined;

        if (task.recurrence) {
            const baseAnchor = task.dueDate || task.assignedDate || Date.now();
            const nextDueDate = getNextRecurrenceDate(baseAnchor, task.recurrence);

            const { id, createdAt, updatedAt, ...rest } = task;

            nextTaskData = {
                ...rest,
                status: 'active',
                dueDate: nextDueDate,
                assignedDate: null,
                completedAt: null,
                actualDuration: null,
                remainingSeconds: null,
                lastStartedAt: null,
                isFocused: false,
            };
        }

        const updatedTask: Partial<TaskEntity> = { ...task, actualDuration: Math.max(0, actualSeconds) };

        return await this.completeTaskAndRespawn(updatedTask as TaskEntity, nextTaskData, allActiveTasks);
    }

    /**
     * Internal atomic operation to update a completed task, create its next instance, and unlock dependencies.
     *
     * @param originalTask - The task being completed.
     * @param nextTaskData - Metadata for the next recurring instance.
     * @param allActiveTasks - Current task list for scanning dependencies.
     *
     * @interaction (Atomic Write Batch)
     * 1. Updates original task status to 'completed'.
     * 2. (Optional) Creates a new task document for the next recurrence.
     * 3. (Optional) Removes the `blockedBy` reference from any tasks waiting on the original task.
     */
    private async completeTaskAndRespawn(originalTask: TaskEntity, nextTaskData?: Omit<TaskEntity, 'id' | 'createdAt' | 'updatedAt'>, allActiveTasks?: TaskEntity[]): Promise<number | null> {
        const uid = contextApi.getUserId();
        if (!uid) return null;

        const batch = writeBatch(db);
        const completedAt = Date.now();
        let nextDueDate: number | null = null;

        // Part 1: Mark original task as complete
        const originalTaskRef = doc(db, 'users', uid, 'tasks', originalTask.id);
        const updatePayload: Partial<Task> = {
            status: 'completed',
            completedAt: completedAt,
            updatedAt: completedAt,
            actualDuration: originalTask.actualDuration,
            remainingSeconds: null,
            lastStartedAt: null,
            isFocused: false
        };
        if (originalTask.duration === 0 && originalTask.actualDuration) {
            updatePayload.duration = Math.max(1, Math.round(originalTask.actualDuration / 60));
        }
        batch.update(originalTaskRef, updatePayload);

        // Part 2: Respawn recurring task
        if (nextTaskData) {
            const nextTaskId = crypto.randomUUID();
            const nextTaskRef = doc(db, 'users', uid, 'tasks', nextTaskId);
            nextDueDate = nextTaskData.dueDate || null;
            batch.set(nextTaskRef, {
                ...nextTaskData,
                id: nextTaskId,
                status: 'active',
                createdAt: completedAt,
                updatedAt: completedAt,
            });
        }

        // Part 3: Unlock dependent tasks
        if (allActiveTasks && allActiveTasks.length > 0) {
            const dependentTasks = allActiveTasks.filter(t => t.blockedBy?.includes(originalTask.id));
            for (const dependent of dependentTasks) {
                const dependentRef = doc(db, 'users', uid, 'tasks', dependent.id);
                const newBlockedBy = (dependent.blockedBy || []).filter(id => id !== originalTask.id);
                batch.update(dependentRef, { blockedBy: newBlockedBy });
            }
        }

        await batch.commit();
        return nextDueDate;
    }
    
    /**
     * Starts a focus session for a task, ensuring all other task sessions are paused.
     *
     * @param taskId - ID of the task to start.
     * @param remainingSeconds - Snapshot of the remaining time for the task.
     * @param allActiveTasks - Current task list to identify and pause the previous active task.
     */
    public async startSession(taskId: string, remainingSeconds: number, allActiveTasks: TaskEntity[]) {
        const uid = contextApi.getUserId();
        if (!uid) return;
    
        const batch = writeBatch(db);
        const now = Date.now();
    
        // 1. Find and stop any currently active session
        const currentFocusedTask = allActiveTasks.find(t => t.isFocused && t.id !== taskId);
        if (currentFocusedTask) {
            const metrics = calculateTaskTime(currentFocusedTask);
            const focusedTaskRef = doc(db, 'users', uid, 'tasks', currentFocusedTask.id);
            batch.update(focusedTaskRef, {
                isFocused: false,
                lastStartedAt: null,
                remainingSeconds: metrics.remaining,
                updatedAt: now
            });
        }
    
        // 2. Start the new session
        const newTaskRef = doc(db, 'users', uid, 'tasks', taskId);
        batch.update(newTaskRef, {
            remainingSeconds,
            lastStartedAt: now,
            isFocused: true,
            updatedAt: now
        });
    
        await batch.commit();
    }

    /**
     * Pauses the timer for a task session.
     * @param taskId - ID of the task to pause.
     * @param remainingSeconds - The current countdown value to persist.
     */
    public async pauseSession(taskId: string, remainingSeconds: number) {
        await this.updateTask(taskId, {
            remainingSeconds,
            lastStartedAt: null,
        });
    }

    /**
     * Stops the focus session and clears the focus flag for a task.
     * @param taskId - ID of the task to stop.
     * @param remainingSeconds - The current countdown value to persist.
     */
    public async stopSession(taskId: string, remainingSeconds: number) {
        await this.updateTask(taskId, {
            remainingSeconds,
            lastStartedAt: null,
            isFocused: false,
        });
    }

    /**
     * Logs the completion details of a task session, including user mood and energy level.
     *
     * @param task - The completed task entity.
     * @param mood - User-reported mood after task (e.g., "Energized").
     * @param notes - User-provided notes about the session.
     * @param newEnergyLevel - The user's energy level at the end of the session.
     *
     * @interaction
     * - Updates the task document with mood and notes.
     * - Adds a record to the `activityLogs` collection for analytics.
     * - Creates a new `UserVital` entry for mood tracking.
     */
    public async logSessionCompletion(task: TaskEntity, mood: string, notes: string, newEnergyLevel?: number): Promise<void> {
        const uid = contextApi.getUserId();
        if (!uid) return;
        
        const timestamp = Date.now();

        await this.updateTask(task.id, {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            completionMood: mood as any,
            completionNotes: notes,
        });

        await addDoc(collection(db, 'users', uid, 'activityLogs'), {
            timestamp,
            weekOfYear: 0,
            shiftType: null,
            type: 'task_complete',
            data: {
                taskId: task.id,
                userMood: mood,
                notes: notes,
                energyResult: newEnergyLevel ?? null
            }
        });

        if (typeof newEnergyLevel === 'number') {
            const context = await contextApi.getSnapshot();
            const vitalId = crypto.randomUUID();
            const vitalRef = doc(db, 'users', uid, 'vitals', vitalId);
            await setDoc(vitalRef, {
                id: vitalId,
                timestamp,
                type: 'mood',
                value: newEnergyLevel,
                context,
                metadata: {
                    source: 'session_completion',
                    taskId: task.id,
                    mood: mood
                }
            });
        }
    }
}

export const taskApi = TaskApi.getInstance();
