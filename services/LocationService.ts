
import { ContextSnapshot } from '../types';
import { UserSettings } from '@/types';

export class LocationService {
    private static instance: LocationService;

    public static getInstance(): LocationService {
        if (!LocationService.instance) {
            LocationService.instance = new LocationService();
        }
        return LocationService.instance;
    }

    public async getLocationStatus(config: UserSettings): Promise<ContextSnapshot['location']> {
        const result: ContextSnapshot['location'] = {
            label: 'Unknown',
            isExact: false,
        };

        if (!config.useLocation || typeof navigator === 'undefined' || !('geolocation' in navigator)) {
            return result;
        }

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 5000,
                    maximumAge: 60000,
                });
            });

            const { latitude, longitude } = position.coords;
            result.lat = latitude;
            result.lng = longitude;
            result.isExact = true;

            if (config.homeLat && config.homeLng) {
                const dist = this.getDistanceFromLatLonInKm(latitude, longitude, config.homeLat, config.homeLng);
                result.label = dist < 0.1 ? 'Home' : 'Remote';
            }
        } catch (e) {
            console.warn('Geolocation failed or denied');
        }

        return result;
    }

    private getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371;
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}
