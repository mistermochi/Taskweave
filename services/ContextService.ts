
import { ContextSnapshot } from '../types';
import { DeviceService } from './DeviceService';
import { LocationService } from './LocationService';
import { MotionService } from './MotionService';
import { UserConfigService } from './UserConfigService';

export class ContextService {
    private static instance: ContextService;
    private userConfigService: UserConfigService;
    private deviceService: DeviceService;
    private locationService: LocationService;
    private motionService: MotionService;
    private userId: string | null = null;

    private constructor() {
        this.userConfigService = UserConfigService.getInstance();
        this.deviceService = DeviceService.getInstance();
        this.locationService = LocationService.getInstance();
        this.motionService = MotionService.getInstance();
    }

    public static getInstance(): ContextService {
        if (!ContextService.instance) {
            ContextService.instance = new ContextService();
        }
        return ContextService.instance;
    }

    public setUserId(uid: string | null) {
        this.userId = uid;
        this.userConfigService.setUserId(uid);
    }
    
    public getUserId(): string | null {
        return this.userId;
    }

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

    public getConfig() {
        return this.userConfigService.getConfig();
    }

    public async requestMotionPermission(): Promise<boolean> {
        return await this.motionService.requestMotionPermission();
    }
}
