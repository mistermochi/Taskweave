'use client';
import { useEffect } from 'react';
import { useUserSettings } from '@/hooks/useUserSettings';

/**
 * Application-wide theme manager.
 * It reactively injects CSS variables into the document root based on the user's
 * configured theme color and mode (light/dark).
 *
 * NOTE: Color theme overrides are currently disabled to maintain
 * standard Shadcn Zinc/Slate palette across the app.
 */
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useUserSettings();

  /**
   * Synchronizes the document's class list and style properties with user settings.
   */
  useEffect(() => {
    const root = document.documentElement;
    
    // Set color mode (dark/light)
    root.classList.remove('light', 'dark');
    root.classList.add(settings.themeMode);

    // Dynamic color theme overrides are disabled to preserve Shadcn defaults
    /*
    const themeColors = THEMES[settings.themeColor as keyof typeof THEMES] || THEMES.green;
    for (const [key, value] of Object.entries(themeColors)) {
      root.style.setProperty(key, value);
    }
    */

  }, [settings.themeMode]);

  return <>{children}</>;
};
