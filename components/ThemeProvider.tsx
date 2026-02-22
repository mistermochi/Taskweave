'use client';
import { useEffect } from 'react';
import { useUserSettings } from '@/hooks/useUserSettings';

// HSL values for themes
const THEMES = {
  green: { '--primary': '149 80% 46%', '--primary-dim': '149 80% 36%' },
  orange: { '--primary': '30 100% 63%', '--primary-dim': '30 100% 53%' },
  purple: { '--primary': '276 95% 76%', '--primary-dim': '276 95% 66%' },
  blue: { '--primary': '210 90% 60%', '--primary-dim': '210 90% 50%' },
  pink: { '--primary': '330 85% 60%', '--primary-dim': '330 85% 50%' },
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useUserSettings();

  useEffect(() => {
    const root = document.documentElement;
    
    // Set mode
    root.classList.remove('light', 'dark');
    root.classList.add(settings.themeMode);

    // Set color
    const themeColors = THEMES[settings.themeColor as keyof typeof THEMES] || THEMES.green;
    for (const [key, value] of Object.entries(themeColors)) {
      root.style.setProperty(key, value);
    }

  }, [settings.themeMode, settings.themeColor]);

  return <>{children}</>;
};
