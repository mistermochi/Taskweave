import { doc, onSnapshot, setDoc, updateDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/shared/api/firebase';
import { UserSettings } from '@/types';

/**
 * Default global settings for a new user.
 */
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

/**
 * Service for managing user-specific configuration and preferences in Firestore.
 * Implements a subscription model to allow other services and components to react
 * to settings changes in real-time.
 *
 * @singleton Use `UserConfigService.getInstance()` to access the service.
 */
export class UserConfigService {
    /** Singleton instance of the service. */
    private static instance: UserConfigService;
    /** Cached current user settings. */
    private settings: UserSettings = DEFAULT_SETTINGS as UserSettings;
    /** Current authenticated user ID. */
    private userId: string | null = null;
    /** Unsubscribe function for the Firestore snapshot listener. */
    private unsubscribe: (() => void) | null = null;
    /** List of callbacks to notify when settings change. */
    private subscribers: ((settings: UserSettings) => void)[] = [];

    /**
     * Private constructor initializing settings to defaults.
     */
    private constructor() {
        this.settings = DEFAULT_SETTINGS as UserSettings;
    }

    /**
     * Returns the singleton instance of UserConfigService.
     * @returns The UserConfigService instance.
     */
    public static getInstance(): UserConfigService {
        if (!UserConfigService.instance) {
            UserConfigService.instance = new UserConfigService();
        }
        return UserConfigService.instance;
    }

    /**
     * Sets the user ID and initializes the Firestore snapshot listener for their settings.
     * If a user logs out, it cleans up the listener and resets to defaults.
     *
     * @param uid - The Firebase user ID or null.
     *
     * @interaction
     * - Listens to `users/{uid}/settings/general` in Firestore.
     * - Automatically creates the settings document with defaults if it doesn't exist.
     */
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

    /**
     * Retrieves the current cached user configuration.
     * @returns The `UserSettings` object.
     */
    public getConfig(): UserSettings {
        return this.settings;
    }

    /**
     * Updates one or more user settings in Firestore.
     *
     * @param updates - Partial object containing the fields to update.
     */
    public async updateSettings(updates: Partial<UserSettings>) {
        if (!this.userId) return;
        const ref = doc(db, this.userId, 'settings', 'general');
        await setDoc(ref, updates, { merge: true });
    }
    
    /**
     * Specialized update for mapping a Google Calendar ID to an internal project/tag ID.
     *
     * @param calendarId - The unique ID of the Google Calendar.
     * @param projectId - The internal ID of the project/tag.
     */
    public async updateCalendarMapping(calendarId: string, projectId: string): Promise<void> {
        if (!this.userId) return;
        const ref = doc(db, this.userId, 'settings', 'general');
        await updateDoc(ref, { [`calendarProjectMapping.${calendarId}`]: projectId });
    }

    /**
     * Registers a callback to be notified whenever the user settings are updated.
     *
     * @param callback - Function receiving the new `UserSettings`.
     * @returns An unsubscribe function to stop receiving updates.
     */
    public subscribe(callback: (settings: UserSettings) => void): () => void {
        this.subscribers.push(callback);
        // Immediate call with current state
        callback(this.settings);
        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    }
}
