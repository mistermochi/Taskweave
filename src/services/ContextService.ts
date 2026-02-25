import { ContextSnapshot } from '../types';
import { DeviceService } from './DeviceService';
import { LocationService } from './LocationService';
import { MotionService } from './MotionService';
import { UserConfigService } from './UserConfigService';

/**
 * Orchestrator service that aggregates various environmental and device context signals.
 * It combines location, motion, device status, and temporal information into a unified `ContextSnapshot`.
 *
 * @singleton Use `ContextService.getInstance()` to access the service.
 */
export class ContextService {
    /** Singleton instance of the service. */
    private static instance: ContextService;
    /** Reference to the User Configuration service. */
    private userConfigService: UserConfigService;
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
        this.userConfigService = UserConfigService.getInstance();
        this.deviceService = DeviceService.getInstance();
        this.locationService = LocationService.getInstance();
        this.motionService = MotionService.getInstance();
    }

    /**
     * Returns the singleton instance of ContextService.
     * @returns The ContextService instance.
     */
    public static getInstance(): ContextService {
        if (!ContextService.instance) {
            ContextService.instance = new ContextService();
        }
        return ContextService.instance;
    }

    /**
     * Sets the current user ID and propagates it to dependent services.
     * @param uid - The Firebase user ID or null.
     */
    public setUserId(uid: string | null) {
        this.userId = uid;
        this.userConfigService.setUserId(uid);
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
        const config = this.userConfigService.getConfig();
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
        return this.userConfigService.getConfig();
    }

    /**
     * Requests permission from the browser/OS to access motion and orientation data.
     * @returns True if permission was granted.
     */
    public async requestMotionPermission(): Promise<boolean> {
        return await this.motionService.requestMotionPermission();
    }
}
