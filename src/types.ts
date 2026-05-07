
export enum ViewName {
  DASHBOARD = 'DASHBOARD',
  DATABASE = 'DATABASE',
  INSIGHTS = 'INSIGHTS',
  BREATHING = 'BREATHING',
  SENSORY_GROUNDING = 'SENSORY_GROUNDING',
  SETTINGS = 'SETTINGS'
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
