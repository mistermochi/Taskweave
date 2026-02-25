'use client';
import { useEffect } from 'react';
import { useUserSettings } from '@/hooks/useUserSettings';

/**
 * Mapping of theme names to their corresponding HSL variable values.
 * Primary represents the main brand color, and Primary-Dim is its darker variant.
 */
const THEMES = {
  green: { '--primary': '149 80% 46%', '--primary-dim': '149 80% 36%' },
  orange: { '--primary': '30 100% 63%', '--primary-dim': '30 100% 53%' },
  purple: { '--primary': '276 95% 76%', '--primary-dim': '276 95% 66%' },
  blue: { '--primary': '210 90% 60%', '--primary-dim': '210 90% 50%' },
  pink: { '--primary': '330 85% 60%', '--primary-dim': '330 85% 50%' },
};

/**
 * Application-wide theme manager.
 * It reactively injects CSS variables into the document root based on the user's
 * configured theme color and mode (light/dark).
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

    // Set primary accent colors
    const themeColors = THEMES[settings.themeColor as keyof typeof THEMES] || THEMES.green;
    for (const [key, value] of Object.entries(themeColors)) {
      root.style.setProperty(key, value);
    }

  }, [settings.themeMode, settings.themeColor]);

  return <>{children}</>;
};
