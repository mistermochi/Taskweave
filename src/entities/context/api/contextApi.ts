import { DeviceService } from '@/services/DeviceService';
import { LocationService } from '@/services/LocationService';
import { MotionService } from '@/services/MotionService';
import { userApi } from '@/entities/user';
import { ContextSnapshot } from '../model/types';

/**
 * Orchestrator API that aggregates various environmental and device context signals.
 * It combines location, motion, device status, and temporal information into a unified `ContextSnapshot`.
 *
 * @singleton Use `contextApi` singleton instance to access functionality.
 */
export class ContextApi {
    /** Singleton instance of the service. */
    private static instance: ContextApi;
    /** Reference to the Device hardware service. */
    private deviceService: DeviceService;
    /** Reference to the Geo-location service. */
    private locationService: LocationService;
    /** Reference to the Motion/Activity service. */
    private motionService: MotionService;
    /** Current authenticated user ID. */
    private userId: string | null = null;

    /**
     * Private constructor initializing dependency services.
     */
    constructor() {
        this.deviceService = DeviceService.getInstance();
        this.locationService = LocationService.getInstance();
        this.motionService = MotionService.getInstance();
    }

    /**
     * Returns the singleton instance of ContextApi.
     * @returns The ContextApi instance.
     */
    public static getInstance(): ContextApi {
        if (!ContextApi.instance) {
            ContextApi.instance = new ContextApi();
        }
        return ContextApi.instance;
    }

    /**
     * Sets the current user ID and propagates it to dependent services.
     * @param uid - The Firebase user ID or null.
     */
    public setUserId(uid: string | null) {
        this.userId = uid;
        userApi.setUserId(uid);
    }
    
    /**
     * Retrieves the current user ID.
     */
    public getUserId(): string | null {
        return this.userId;
    }

    /**
     * Generates a point-in-time snapshot of all context signals.
     *
     * @returns A promise resolving to a `ContextSnapshot`.
     *
     * @logic
     * 1. Fetches current time and evaluates work hours based on user config.
     * 2. Concurrently fetches device and location status.
     * 3. Syncs current motion activity.
     * 4. Returns the combined object.
     */
    public async getSnapshot(): Promise<ContextSnapshot> {
        const config = userApi.getConfig();
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay();
        const isWeekend = day === 0 || day === 6;
        const isWorkHours = !isWeekend && hour >= config.workStartHour && hour < config.workEndHour;

        const [deviceContext, locationContext] = await Promise.all([
            this.deviceService.getDeviceStatus(),
            this.locationService.getLocationStatus(config),
        ]);

        const activityContext = this.motionService.getActivityStatus();

        return {
            location: locationContext,
            environment: {
                isDaytime: hour > 6 && hour < 20,
            },
            device: deviceContext,
            activity: activityContext,
            temporal: {
                hour,
                dayOfWeek: day,
                isWorkHours,
            },
        };
    }

    /**
     * Helper to retrieve the current user configuration.
     */
    public getConfig() {
        return userApi.getConfig();
    }

    /**
     * Requests permission from the browser/OS to access motion and orientation data.
     * @returns True if permission was granted.
     */
    public async requestMotionPermission(): Promise<boolean> {
        return await this.motionService.requestMotionPermission();
    }
}

/**
 * Singleton instance of the contextApi.
 */
export const contextApi = ContextApi.getInstance();
