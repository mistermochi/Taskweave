
import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/Card';
import { Zap, MapPin, Move, Battery } from 'lucide-react';
import { UserSettings } from '@/hooks/useUserSettings';
import { ContextService } from '@/services/ContextService';

interface ContextSensorsSettingsProps {
  settings: Partial<UserSettings>;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const ContextSensorsSettings: React.FC<ContextSensorsSettingsProps> = ({ settings, updateSettings }) => {
  const [locationStatus, setLocationStatus] = useState<string>(settings.homeLat ? 'Home Location Set' : 'Unknown');
  const contextService = ContextService.getInstance();

  const toggleLocation = () => {
    const newState = !settings.useLocation;
    updateSettings({ useLocation: newState });
    
    if (newState && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(() => {}, (err) => console.warn(err));
    }
  };

  const toggleMotion = async () => {
    const newState = !settings.useMotion;
    
    if (newState) {
        const granted = await contextService.requestMotionPermission();
        if (granted) {
            updateSettings({ useMotion: true });
        } else {
            alert("Motion permission denied or not supported.");
        }
    } else {
        updateSettings({ useMotion: false });
    }
  };

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
          {/* Location */}
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

          {/* Home Location */}
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

          {/* Motion */}
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
