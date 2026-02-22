
import { ContextSnapshot } from '../types';

export class DeviceService {
    private static instance: DeviceService;

    public static getInstance(): DeviceService {
        if (!DeviceService.instance) {
            DeviceService.instance = new DeviceService();
        }
        return DeviceService.instance;
    }

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
