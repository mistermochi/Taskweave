
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

export type ShiftType = 'A' | 'P' | 'AP' | 'AN' | 'PN' | 'Off' | null;

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

export interface UserSettings {
  displayName: string;
  photoURL?: string;
  workStartHour: number;
  workEndHour: number;
  sleepStartHour: number;
  sleepEndHour: number;
  useLocation: boolean;
  useMotion: boolean;
  homeLat?: number;
  homeLng?: number;
  themeMode: 'light' | 'dark';
  themeColor: string;
  calendarProjectMapping?: { [calendarId: string]: string; };
  enabledCalendars?: string[];
  googleCalendars?: { id: string; summary: string }[];
}

export interface UserStats {
  energyLevel: number;
  tasksLeft: number;
  focusScore: 'High' | 'Medium' | 'Low';
}
