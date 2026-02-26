import { useState, useEffect } from 'react';
import { UserSettings } from '../model/types';
import { userApi } from '../api/userApi';

/**
 * Custom hook that provides real-time access to the user's settings.
 * It synchronizes with the `userApi` singleton to ensure settings
 * are consistent across all components.
 *
 * @returns Object containing the current settings, loading state, and an update function.
 */
export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(userApi.getConfig());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = userApi.subscribe(newSettings => {
      setSettings(newSettings);
      setLoading(false);
    });
    
    const currentSettings = userApi.getConfig();
    if(currentSettings) {
        setSettings(currentSettings);
        if(currentSettings.displayName !== 'Traveler') {
             setLoading(false);
        }
    }
    
    return () => unsubscribe();
  }, []);

  /**
   * Updates one or more user settings in Firestore.
   */
  const updateSettings = async (updates: Partial<UserSettings>) => {
    await userApi.updateSettings(updates);
  };

  return { settings, loading, updateSettings };
};
