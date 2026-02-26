

export enum ViewName {
  DASHBOARD = 'DASHBOARD',
  DATABASE = 'DATABASE',
  INSIGHTS = 'INSIGHTS',
  NEW_TASK = 'NEW_TASK',
  CHAT = 'CHAT',
  BREATHING = 'BREATHING',
  SENSORY_GROUNDING = 'SENSORY_GROUNDING',
  TASK_HISTORY = 'TASK_HISTORY',
  SETTINGS = 'SETTINGS'
}

export type NavigationParams = string | { taskId?: string; initialTitle?: string; mode?: 'default' | 'focus' };

export type NavigationHandler = (view: ViewName, params?: NavigationParams) => void;

// Category is a dynamic string (Tag ID or Name)
export type Category = string;

export type EnergyLevel = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'active' | 'completed' | 'skipped' | 'archived';
export type ShiftType = 'A' | 'P' | 'AP' | 'AN' | 'PN' | 'Off' | null;

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

// Keeping the simpler UI Task interface for compatibility if needed, 
// but mapping it to TaskEntity is preferred in new code.
export interface Task extends TaskEntity {} 

export interface ActivityLog {
  id?: number;             // Auto-increment (IndexedDB handles this)
  timestamp: number;
  weekOfYear: number;      // 1-52
  shiftType: ShiftType;    // Contextual shift type for this day
  type: 'task_complete' | 'task_skip' | 'energy_check_in' | 'plan_generated';
  
  // Context snapshot at the moment of action
  data: {
    taskId?: string;
    energyLevel?: number; // 0-100 slider value
    userMood?: string;
    notes?: string;
  };
}

// ContextSnapshot and UserVital moved to their respective FSD entities

export interface Habit {
  id: string;
  type: 'working_hours' | 'sleep_window' | 'recurring_task';
  config: {
    days: number[];       // [1, 2, 3, 4, 5] (Mon-Fri)
    start?: string;       // "09:00"
    end?: string;         // "17:00"
    shiftContext?: ShiftType[]; // Only apply this habit on these shift days
  };
  confidence: number;     // 0-1 (How sure the AI is about this habit)
}

export interface DailyPlan {
  date: string;           // "2023-10-24" (PK)
  shiftType: ShiftType;
  suggestedBlocks: {
    timeBlock: string;    // "Morning"
    taskIds: string[];
    rationale: string;    // "You usually have high energy here."
  }[];
  generatedAt: number;
}

export interface ChatMessage {
  id: string;
  timestamp: number;
  sender: 'user' | 'coach';
  text: string;
  actionTaken?: string; 
}

// UserSettings and UserStats moved to src/entities/user
