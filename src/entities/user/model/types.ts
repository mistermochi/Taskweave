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
