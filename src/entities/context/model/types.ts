export interface ContextSnapshot {
  location: {
    lat?: number;
    lng?: number;
    label: 'Home' | 'Work' | 'Transit' | 'Remote' | 'Unknown';
    isExact: boolean;
  };
  environment: {
    isDaytime: boolean;
    weatherCondition?: string;
  };
  device: {
    batteryLevel?: number; // 0.0 - 1.0
    isCharging?: boolean;
    isOnline: boolean;
    networkType?: string;    // 'wifi', 'cellular', 'ethernet', 'none'
    effectiveType?: string;  // 'slow-2g', '2g', '3g', '4g'
  };
  activity: {
    isMoving: boolean; // Derived from devicemotion
    motionIntensity: 'Stationary' | 'Light' | 'Moderate' | 'Active';
  };
  temporal: {
    hour: number;
    dayOfWeek: number;
    isWorkHours: boolean; // Based on simple 9-5 rule or settings
  };
}
