"use client";

import { useUserSettings } from "@/hooks/useUserSettings";
import { Sun, Moon } from 'lucide-react';
import { cn, vibrate } from "@/shared/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/ui/card";
import { Label } from "@/shared/ui/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/ui/toggle-group";

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
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize the appearance of the app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Theme Mode</Label>
          <ToggleGroup
            type="single"
            value={settings.themeMode}
            onValueChange={(value) => {
              if (value) {
                updateSettings({ themeMode: value as 'light' | 'dark' });
                vibrate('light');
              }
            }}
            className="grid grid-cols-2 gap-2"
          >
            <ToggleGroupItem
              value="light"
              className="flex items-center justify-center gap-2 h-10 border data-[state=on]:border-primary data-[state=on]:bg-primary/5"
            >
              <Sun className="h-4 w-4" />
              <span className="text-xs font-medium">Light</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="dark"
              className="flex items-center justify-center gap-2 h-10 border data-[state=on]:border-primary data-[state=on]:bg-primary/5"
            >
              <Moon className="h-4 w-4" />
              <span className="text-xs font-medium">Dark</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Accent Color</Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(THEME_COLORS).map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  updateSettings({ themeColor: key });
                  vibrate('light');
                }}
                className="flex items-center justify-center p-0.5 rounded-full transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none"
                title={value.name}
                aria-label={`Set accent color to ${value.name}`}
                aria-pressed={settings.themeColor === key}
              >
                <div
                  style={{ backgroundColor: `hsl(${value.hsl})` }}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                    settings.themeColor === key
                      ? "border-foreground scale-110"
                      : "border-transparent opacity-80"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
