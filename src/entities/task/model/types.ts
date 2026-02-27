import { Category } from '@/entities/tag';

export type EnergyLevel = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'active' | 'completed' | 'skipped' | 'archived';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  interval: number; // e.g. 1

  // Weekly Specific
  weekDays?: number[]; // 0 (Sun) - 6 (Sat)

  // Monthly Specific
  // If null, defaults to same day of month (e.g. 27th)
  monthlyType?: 'date' | 'relative';
  // For relative: "4th Tuesday" -> weekOfMonth: 4, dayOfWeek: 2
  weekOfMonth?: number; // 1, 2, 3, 4, or 5 (Last)
}

export interface TaskEntity {
  id: string;              // UUID
  title: string;
  category: Category;      // Now stores Tag ID (or legacy name), can be empty string if uncategorized
  notes?: string;

  // Scheduling & Filtering
  status: TaskStatus;
  isFocused?: boolean;     // Added for Focus Queue
  dueDate?: number;        // Unix timestamp (Deadline)
  assignedDate?: number;   // Unix timestamp (When user plans to do it)
  duration: number;        // Minutes
  energy: EnergyLevel;
  recurrence?: RecurrenceConfig; // New: Recurring task configuration
  timeZone?: string;
  googleCalendarEventId?: string;
  googleCalendarId?: string;

  // Dependencies
  blockedBy: string[];     // IDs of tasks that must be completed before this one

  // Metadata
  createdAt: number;
  updatedAt?: number;       // Last modification time
  completedAt?: number;
  actualDuration?: number; // Actual time spent in seconds
  remainingSeconds?: number; // Snapshot of timer state for pausing/resuming
  lastStartedAt?: number;  // Timestamp (ms) when the active session started/resumed
  archivedAt?: number;     // When task was archived

  // Completion Context
  completionMood?: 'Energized' | 'Neutral' | 'Drained';
  completionNotes?: string;

  // AI/Vector hooks (Future proofing)
  embedding?: number[];    // For semantic search later
}

export interface Task extends TaskEntity {}
