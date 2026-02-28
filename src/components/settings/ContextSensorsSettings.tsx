import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/shared/ui/ui/card';
import { Zap, MapPin, Move, Battery } from 'lucide-react';
import { UserSettings } from '@/hooks/useUserSettings';
import { contextApi } from '@/entities/context';

/**
 * Interface for ContextSensorsSettings props.
 */
interface ContextSensorsSettingsProps {
  /** The current user settings object. */
  settings: Partial<UserSettings>;
  /** Callback to update one or more settings. */
  updateSettings: (newSettings: Partial<UserSettings>) => void;
}

/**
 * Settings section for managing hardware sensor permissions and context detection.
 * Allows the user to enable/disable location and motion tracking, which are used
 * to provide personalized, environment-aware task suggestions.
 *
 * @component
 */
export const ContextSensorsSettings: React.FC<ContextSensorsSettingsProps> = ({ settings, updateSettings }) => {
  const [locationStatus, setLocationStatus] = useState<string>(settings.homeLat ? 'Home Location Set' : 'Unknown');

  /**
   * Toggles the use of the Geolocation API.
   */
  const toggleLocation = () => {
    const newState = !settings.useLocation;
    updateSettings({ useLocation: newState });
    
    if (newState && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(() => {}, (err) => console.warn(err));
    }
  };

  /**
   * Toggles the use of the Device Motion API.
   * Requests explicit browser permission if required (e.g., on iOS).
   */
  const toggleMotion = async () => {
    const newState = !settings.useMotion;
    
    if (newState) {
        const granted = await contextApi.requestMotionPermission();
        if (granted) {
            updateSettings({ useMotion: true });
        } else {
            alert("Motion permission denied or not supported.");
        }
    } else {
        updateSettings({ useMotion: false });
    }
  };

  /**
   * Captures the user's current coordinates and saves them as the "Home" baseline
   * for location-aware logic.
   */
  const setHomeLocation = () => {
    if ('geolocation' in navigator) {
      setLocationStatus('Locating...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateSettings({ homeLat: latitude, homeLng: longitude });
          setLocationStatus('Home Location Updated!');
          setTimeout(() => setLocationStatus('Home Location Set'), 3000);
        },
        (err) => {
          console.error(err);
          setLocationStatus('Error getting location');
        },
        { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
      );
    } else {
      setLocationStatus('Geolocation not supported');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Zap size={18} />
        </div>
        <div>
          <CardTitle>Context Sensors</CardTitle>
          <CardDescription>Allow Taskweave to adapt to your environment.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className="space-y-4">
          {/* Location Toggle */}
          <div className="flex items-center justify-between p-3 bg-surface-highlight rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <MapPin size={18} className={settings.useLocation ? "text-primary" : "text-secondary"} />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">Location</span>
                <span className="text-xxs text-secondary">Home vs Work detection</span>
              </div>
            </div>
            <button 
              onClick={toggleLocation}
              className={`w-10 h-6 rounded-full transition-colors relative ${settings.useLocation ? 'bg-primary' : 'bg-foreground/10'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-background rounded-full transition-transform ${settings.useLocation ? 'translate-x-4' : ''}`}></div>
            </button>
          </div>

          {/* Home Baseline Configuration */}
          {settings.useLocation && (
            <div className="flex items-center justify-between p-3 bg-surface-highlight rounded-xl border border-border">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">Set &quot;Home&quot;</span>
                <span className={`text-xxs ${locationStatus.includes('Error') ? 'text-red-400' : 'text-primary'}`}>{locationStatus}</span>
              </div>
              <button 
                onClick={setHomeLocation}
                className="px-3 py-1.5 text-xs font-bold bg-foreground/10 hover:bg-foreground/20 rounded-lg text-foreground transition-colors"
              >
                Set Current
              </button>
            </div>
          )}

          {/* Motion Toggle */}
          <div className="flex items-center justify-between p-3 bg-surface-highlight rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <Move size={18} className={settings.useMotion ? "text-primary" : "text-secondary"} />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">Activity</span>
                <span className="text-xxs text-secondary">Detect walking vs sitting</span>
              </div>
            </div>
            <button 
              onClick={toggleMotion}
              className={`w-10 h-6 rounded-full transition-colors relative ${settings.useMotion ? 'bg-primary' : 'bg-foreground/10'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-background rounded-full transition-transform ${settings.useMotion ? 'translate-x-4' : ''}`}></div>
            </button>
          </div>

          {/* Static Battery Status Indicator */}
          <div className="flex items-center justify-between p-3 bg-surface-highlight rounded-xl border border-border opacity-75">
            <div className="flex items-center gap-3">
              <Battery size={18} className="text-secondary" />
              <span className="text-sm font-medium text-foreground">Battery Aware</span>
            </div>
            <span className="text-xxs font-bold text-primary uppercase">Always On</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
