"use client";

import { useUserSettings } from "@/hooks/useUserSettings";
import { Sparkles, Sun, Moon } from 'lucide-react';
import { cn } from "@/shared/lib/utils";

const THEME_COLORS = {
  green: { name: 'Mantis', hsl: '149 80% 46%' },
  orange: { name: 'Marigold', hsl: '30 100% 63%' },
  purple: { name: 'Lavender', hsl: '276 95% 76%' },
  blue: { name: 'Sky', hsl: '210 90% 60%' },
  pink: { name: 'Orchid', hsl: '330 85% 60%' },
};

export function AppearanceForm() {
  const { settings, updateSettings } = useUserSettings();

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize the appearance of the app. Automatically switch between day and night themes.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Theme Mode</label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              onClick={() => updateSettings({ themeMode: 'light' })}
              className={cn(
                "py-2 flex items-center justify-center gap-2 text-sm font-medium rounded-lg border transition-colors",
                settings.themeMode === 'light'
                  ? "bg-accent text-accent-foreground border-accent"
                  : "text-muted-foreground bg-transparent border-input hover:bg-accent/50"
              )}
            >
              <Sun size={14} /> Light
            </button>
            <button
              onClick={() => updateSettings({ themeMode: 'dark' })}
              className={cn(
                "py-2 flex items-center justify-center gap-2 text-sm font-medium rounded-lg border transition-colors",
                settings.themeMode === 'dark'
                  ? "bg-accent text-accent-foreground border-accent"
                  : "text-muted-foreground bg-transparent border-input hover:bg-accent/50"
              )}
            >
              <Moon size={14} /> Dark
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Accent Color</label>
          <div className="flex flex-wrap gap-3 mt-2">
            {Object.entries(THEME_COLORS).map(([key, value]) => (
              <button
                key={key}
                onClick={() => updateSettings({ themeColor: key })}
                className="flex items-center gap-2"
                title={value.name}
              >
                <div
                  style={{ backgroundColor: `hsl(${value.hsl})` }}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all",
                    settings.themeColor === key
                      ? "border-foreground scale-110"
                      : "border-transparent opacity-70 hover:opacity-100"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
