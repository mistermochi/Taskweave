
export enum ViewName {
  DASHBOARD = 'DASHBOARD',
  DATABASE = 'DATABASE',
  INSIGHTS = 'INSIGHTS',
  CHAT = 'CHAT',
  BREATHING = 'BREATHING',
  SENSORY_GROUNDING = 'SENSORY_GROUNDING',
  TASK_HISTORY = 'TASK_HISTORY',
  SETTINGS = 'SETTINGS'
}

export type NavigationParams = string | { taskId?: string; initialTitle?: string; mode?: 'default' | 'focus' };

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

