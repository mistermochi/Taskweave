import { ContextSnapshot } from '@/entities/context';
import { UserSettings, userApi } from '@/entities/user';

/**
 * Service for detecting device motion and activity intensity.
 * It uses the Device Motion API to determine if the user is stationary or moving,
 * which helps the application decide when to suggest physical breaks vs. deep focus.
 *
 * @singleton Use `MotionService.getInstance()` to access the service.
 */
export class MotionService {
    /** Singleton instance of the service. */
    private static instance: MotionService;
    /** Current motion state. */
    private isMoving = false;
    /** The magnitude of the last detected acceleration vector. */
    private lastMotionValue = 0;
    /** Timeout to reset motion state to stationary after inactivity. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private motionTimeout: any = null;
    /** Throttle timestamp for motion events. */
    private lastMotionCheck = 0;
    /** Internal flag tracking whether the window event listener is active. */
    private isListenerActive = false;
    /** Unsubscribe function for user configuration changes. */
    private configUnsubscribe: (() => void) | null = null;

    /**
     * Private constructor that subscribes to user settings to enable/disable
     * the motion listener reactively.
     */
    private constructor() {
        this.configUnsubscribe = userApi.subscribe(this.updateMotionListener);
    }

    /**
     * Returns the singleton instance of MotionService.
     * @returns The MotionService instance.
     */
    public static getInstance(): MotionService {
        if (!MotionService.instance) {
            MotionService.instance = new MotionService();
        }
        return MotionService.instance;
    }

    /**
     * Toggles the event listener based on user preferences.
     */
    private updateMotionListener = (config: UserSettings) => {
        if (config.useMotion) {
            this.startMotionListener();
        } else {
            this.stopMotionListener();
        }
    };

    /**
     * Requests explicit permission from the user/browser to access motion sensors.
     * Necessary for iOS and some modern mobile browsers.
     *
     * @returns A promise resolving to true if permission was granted.
     */
    public async requestMotionPermission(): Promise<boolean> {
        if (typeof window === 'undefined') return false;

        const handlePermission = async (granted: boolean) => {
            if (granted) {
                await userApi.updateSettings({ useMotion: true });
            }
            return granted;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const response = await (DeviceMotionEvent as any).requestPermission();
                return await handlePermission(response === 'granted');
            } catch (e) {
                console.error('Motion permission error', e);
                return false;
            }
        } else {
            return await handlePermission(true);
        }
    }

    /**
     * Attaches the `devicemotion` event listener to the window.
     */
    private startMotionListener() {
        if (typeof window !== 'undefined' && 'ondevicemotion' in window && !this.isListenerActive) {
            window.addEventListener('devicemotion', this.handleMotion);
            this.isListenerActive = true;
        }
    }

    /**
     * Removes the `devicemotion` event listener.
     */
    private stopMotionListener() {
        if (typeof window !== 'undefined' && this.isListenerActive) {
            window.removeEventListener('devicemotion', this.handleMotion);
            this.isListenerActive = false;
        }
    }

    /**
     * Event handler for raw device motion data.
     * Calculates acceleration magnitude and classifies movement.
     */
    private handleMotion = (event: DeviceMotionEvent) => {
        const now = Date.now();
        // Throttle updates to 5Hz to save CPU
        if (now - this.lastMotionCheck < 200) return;
        this.lastMotionCheck = now;

        const acc = event.acceleration;
        if (!acc) return;

        // Euclidean magnitude of acceleration
        const magnitude = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);

        if (magnitude > 0.5) {
            this.isMoving = true;
            this.lastMotionValue = magnitude;

            if (this.motionTimeout) clearTimeout(this.motionTimeout);

            // If no motion for 5 seconds, revert to stationary
            this.motionTimeout = setTimeout(() => {
                this.isMoving = false;
                this.lastMotionValue = 0;
            }, 5000);
        }
    };

    /**
     * Returns the current motion activity classification.
     *
     * @returns Intensity levels: Stationary, Light, Moderate, or Active.
     */
    public getActivityStatus(): ContextSnapshot['activity'] {
        let intensity: 'Stationary' | 'Light' | 'Moderate' | 'Active' = 'Stationary';

        if (this.isMoving) {
            if (this.lastMotionValue > 2.5) intensity = 'Active';
            else if (this.lastMotionValue > 1.0) intensity = 'Moderate';
            else intensity = 'Light';
        }

        return {
            isMoving: this.isMoving,
            motionIntensity: intensity,
        };
    }
}
