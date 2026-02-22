
import { doc, onSnapshot, setDoc, updateDoc, DocumentData } from 'firebase/firestore';
import { db } from '../firebase';
import { UserSettings } from '@/types';

const DEFAULT_SETTINGS: Omit<UserSettings, 'homeLat' | 'homeLng' | 'photoURL' | 'calendarProjectMapping'> = {
  displayName: 'Traveler',
  workStartHour: 9,
  workEndHour: 17,
  sleepStartHour: 23,
  sleepEndHour: 7,
  useLocation: false,
  useMotion: false,
  themeMode: 'dark',
  themeColor: 'green',
};

export class UserConfigService {
    private static instance: UserConfigService;
    private settings: UserSettings = DEFAULT_SETTINGS as UserSettings;
    private userId: string | null = null;
    private unsubscribe: (() => void) | null = null;
    private subscribers: ((settings: UserSettings) => void)[] = [];

    private constructor() {
        this.settings = DEFAULT_SETTINGS as UserSettings;
    }

    public static getInstance(): UserConfigService {
        if (!UserConfigService.instance) {
            UserConfigService.instance = new UserConfigService();
        }
        return UserConfigService.instance;
    }

    public setUserId(uid: string | null) {
        if (this.userId === uid) return;
        this.userId = uid;

        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        if (uid) {
            const ref = doc(db, 'users', uid, 'settings', 'general');
            this.unsubscribe = onSnapshot(ref, (snap) => {
                if (snap.exists()) {
                    this.settings = { ...DEFAULT_SETTINGS, ...snap.data() } as UserSettings;
                } else {
                    const defaultWithDisplayName = { ...DEFAULT_SETTINGS, displayName: 'Traveler' };
                    this.settings = defaultWithDisplayName as UserSettings;
                    setDoc(ref, defaultWithDisplayName, { merge: true });
                }
                this.subscribers.forEach(cb => cb(this.settings));
            });
        } else {
            this.settings = { ...DEFAULT_SETTINGS, displayName: 'Traveler' } as UserSettings;
            this.subscribers.forEach(cb => cb(this.settings));
        }
    }

    public getConfig(): UserSettings {
        return this.settings;
    }

    public async updateSettings(updates: Partial<UserSettings>) {
        if (!this.userId) return;
        const ref = doc(db, 'users', this.userId, 'settings', 'general');
        await setDoc(ref, updates, { merge: true });
    }
    
    public async updateCalendarMapping(calendarId: string, projectId: string): Promise<void> {
        if (!this.userId) return;
        const ref = doc(db, 'users', this.userId, 'settings', 'general');
        await updateDoc(ref, { [`calendarProjectMapping.${calendarId}`]: projectId });
    }

    public subscribe(callback: (settings: UserSettings) => void): () => void {
        this.subscribers.push(callback);
        callback(this.settings);
        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    }
}
