import { useState, useEffect } from 'react';
import { UserSettings as UserSettingsType } from '@/types';
import { UserConfigService } from '@/services/UserConfigService';

export type UserSettings = UserSettingsType;

/**
 * Custom hook that provides real-time access to the user's settings.
 * It synchronizes with the `UserConfigService` singleton to ensure settings
 * are consistent across all components.
 *
 * @returns Object containing the current settings, loading state, and an update function.
 */
export const useUserSettings = () => {
  const userConfigService = UserConfigService.getInstance();
  const [settings, setSettings] = useState<UserSettings>(userConfigService.getConfig());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = userConfigService.subscribe(newSettings => {
      setSettings(newSettings);
      setLoading(false);
    });
    
    const currentSettings = userConfigService.getConfig();
    if(currentSettings) {
        setSettings(currentSettings);
        if(currentSettings.displayName !== 'Traveler') {
             setLoading(false);
        }
    }
    
    return () => unsubscribe();
  }, [userConfigService]);

  /**
   * Updates one or more user settings in Firestore.
   */
  const updateSettings = async (updates: Partial<UserSettings>) => {
    await userConfigService.updateSettings(updates);
  };

  return { settings, loading, updateSettings };
};
