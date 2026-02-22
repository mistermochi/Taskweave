
import { useState, useEffect } from 'react';
import { UserSettings as UserSettingsType } from '@/types';
import { UserConfigService } from '@/services/UserConfigService';

export type UserSettings = UserSettingsType;

export const useUserSettings = () => {
  const userConfigService = UserConfigService.getInstance();
  const [settings, setSettings] = useState<UserSettings>(userConfigService.getConfig());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = userConfigService.subscribe(newSettings => {
      setSettings(newSettings);
      setLoading(false);
    });
    
    // Set initial state synchronously in case subscription is delayed
    const currentSettings = userConfigService.getConfig();
    if(currentSettings) {
        setSettings(currentSettings);
        if(currentSettings.displayName !== 'Traveler') { // A simple check to see if settings are likely loaded
             setLoading(false);
        }
    }
    
    return () => unsubscribe();
  }, [userConfigService]);

  const updateSettings = async (updates: Partial<UserSettings>) => {
    await userConfigService.updateSettings(updates);
  };

  return { settings, loading, updateSettings };
};
