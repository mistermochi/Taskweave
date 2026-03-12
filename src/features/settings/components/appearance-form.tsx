"use client";

import { useUserSettings } from "@/hooks/useUserSettings";
import { Sun, Moon } from 'lucide-react';
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

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Theme Mode</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => updateSettings({ themeMode: 'light' })}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all hover:bg-accent",
                settings.themeMode === 'light'
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-muted bg-transparent text-muted-foreground"
              )}
            >
              <Sun className="h-6 w-6" />
              <span className="text-xs font-semibold">Light</span>
            </button>
            <button
              onClick={() => updateSettings({ themeMode: 'dark' })}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all hover:bg-accent",
                settings.themeMode === 'dark'
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-muted bg-transparent text-muted-foreground"
              )}
            >
              <Moon className="h-6 w-6" />
              <span className="text-xs font-semibold">Dark</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Accent Color</label>
          <div className="flex flex-wrap gap-4">
            {Object.entries(THEME_COLORS).map(([key, value]) => (
              <button
                key={key}
                onClick={() => updateSettings({ themeColor: key })}
                className="flex flex-col items-center gap-2 group"
                title={value.name}
              >
                <div
                  style={{ backgroundColor: `hsl(${value.hsl})` }}
                  className={cn(
                    "w-10 h-10 rounded-full border-4 transition-all group-hover:scale-110",
                    settings.themeColor === key
                      ? "border-foreground"
                      : "border-transparent opacity-70"
                  )}
                />
                <span className={cn(
                  "text-[10px] font-medium uppercase tracking-wider",
                  settings.themeColor === key ? "text-foreground" : "text-muted-foreground opacity-0 group-hover:opacity-100"
                )}>
                  {value.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
