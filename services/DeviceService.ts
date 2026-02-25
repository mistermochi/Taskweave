import { ContextSnapshot } from '../types';

/**
 * Service for interacting with device-specific hardware features and sensors.
 * It provides access to battery status, network connectivity, and other PWA capabilities.
 *
 * @singleton Use `DeviceService.getInstance()` to access the service.
 */
export class DeviceService {
    /** Singleton instance of the service. */
    private static instance: DeviceService;

    /**
     * Returns the singleton instance of DeviceService.
     * @returns The DeviceService instance.
     */
    public static getInstance(): DeviceService {
        if (!DeviceService.instance) {
            DeviceService.instance = new DeviceService();
        }
        return DeviceService.instance;
    }

    /**
     * Retrieves the current hardware status of the device.
     *
     * @returns A promise resolving to the device's connectivity and battery state.
     *
     * @logic
     * 1. Detects battery level and charging state using the Battery Status API.
     * 2. Checks online/offline status via the Navigator API.
     * 3. (Optional) Extracts network quality metrics (e.g., 4g, wifi) if available.
     */
    public async getDeviceStatus(): Promise<ContextSnapshot['device']> {
        let batteryLevel = 1.0;
        let isCharging = true;
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

        if (typeof navigator !== 'undefined' && 'getBattery' in (navigator as any)) {
            try {
                const battery: any = await (navigator as any).getBattery();
                batteryLevel = battery.level;
                isCharging = battery.charging;
            } catch (e) {
                // Fallback
            }
        }

        let networkType: string | undefined;
        let effectiveType: string | undefined;

        if (typeof navigator !== 'undefined' && (navigator as any).connection) {
            const conn = (navigator as any).connection;
            networkType = conn.type;
            effectiveType = conn.effectiveType;
        }

        return {
            batteryLevel,
            isCharging,
            isOnline,
            ...(networkType !== undefined && { networkType }),
            ...(effectiveType !== undefined && { effectiveType }),
        };
    }
}
