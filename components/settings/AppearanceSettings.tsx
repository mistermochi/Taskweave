
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/Card';
import { Sparkles, Sun, Moon } from 'lucide-react';
import { UserSettings } from '@/hooks/useUserSettings';

const THEME_COLORS = {
  green: { name: 'Mantis', hsl: '149 80% 46%' },
  orange: { name: 'Marigold', hsl: '30 100% 63%' },
  purple: { name: 'Lavender', hsl: '276 95% 76%' },
  blue: { name: 'Sky', hsl: '210 90% 60%' },
  pink: { name: 'Orchid', hsl: '330 85% 60%' },
};

interface AppearanceSettingsProps {
  settings: Partial<UserSettings>;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ settings, updateSettings }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles size={18} />
        </div>
        <div>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize your workspace.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-secondary/80 font-bold uppercase tracking-wider">Mode</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={() => updateSettings({ themeMode: 'light' })} className={`py-2 flex items-center justify-center gap-2 text-sm font-medium rounded-lg border transition-colors ${settings.themeMode === 'light' ? 'bg-foreground/10 text-foreground border-foreground/20' : 'text-secondary bg-surface-highlight border-border hover:border-foreground/20'}`}>
                <Sun size={14} /> Light
              </button>
              <button onClick={() => updateSettings({ themeMode: 'dark' })} className={`py-2 flex items-center justify-center gap-2 text-sm font-medium rounded-lg border transition-colors ${settings.themeMode === 'dark' ? 'bg-foreground/10 text-foreground border-foreground/20' : 'text-secondary bg-surface-highlight border-border hover:border-foreground/20'}`}>
                <Moon size={14} /> Dark
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-secondary/80 font-bold uppercase tracking-wider">Accent Color</label>
            <div className="flex flex-wrap gap-3 mt-2">
              {Object.entries(THEME_COLORS).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => updateSettings({ themeColor: key })}
                  className="flex items-center gap-2"
                  title={value.name}
                >
                  <div style={{ backgroundColor: `hsl(${value.hsl})` }} className={`w-8 h-8 rounded-full border-2 transition-all ${settings.themeColor === key ? 'border-foreground scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
