
import { ContextSnapshot } from '../types';
import { UserConfigService } from './UserConfigService';
import { UserSettings } from '@/types';

export class MotionService {
    private static instance: MotionService;
    private isMoving = false;
    private lastMotionValue = 0;
    private motionTimeout: any = null;
    private lastMotionCheck = 0;
    private isListenerActive = false;
    private configUnsubscribe: (() => void) | null = null;

    private constructor() {
        this.configUnsubscribe = UserConfigService.getInstance().subscribe(this.updateMotionListener);
    }

    public static getInstance(): MotionService {
        if (!MotionService.instance) {
            MotionService.instance = new MotionService();
        }
        return MotionService.instance;
    }

    private updateMotionListener = (config: UserSettings) => {
        if (config.useMotion) {
            this.startMotionListener();
        } else {
            this.stopMotionListener();
        }
    };

    public async requestMotionPermission(): Promise<boolean> {
        if (typeof window === 'undefined') return false;

        const handlePermission = async (granted: boolean) => {
            if (granted) {
                await UserConfigService.getInstance().updateSettings({ useMotion: true });
            }
            return granted;
        }

        if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
            try {
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

    private startMotionListener() {
        if (typeof window !== 'undefined' && 'ondevicemotion' in window && !this.isListenerActive) {
            window.addEventListener('devicemotion', this.handleMotion);
            this.isListenerActive = true;
        }
    }

    private stopMotionListener() {
        if (typeof window !== 'undefined' && this.isListenerActive) {
            window.removeEventListener('devicemotion', this.handleMotion);
            this.isListenerActive = false;
        }
    }

    private handleMotion = (event: DeviceMotionEvent) => {
        const now = Date.now();
        if (now - this.lastMotionCheck < 200) return;
        this.lastMotionCheck = now;

        const acc = event.acceleration;
        if (!acc) return;

        const magnitude = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);

        if (magnitude > 0.5) {
            this.isMoving = true;
            this.lastMotionValue = magnitude;

            if (this.motionTimeout) clearTimeout(this.motionTimeout);

            this.motionTimeout = setTimeout(() => {
                this.isMoving = false;
                this.lastMotionValue = 0;
            }, 5000);
        }
    };

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
