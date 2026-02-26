import React from 'react';
import { User, BedDouble } from 'lucide-react';
import { UserSettings } from '@/entities/user';

/**
 * Interface for TypicalScheduleSettings props.
 */
interface TypicalScheduleSettingsProps {
  /** The current user settings object. */
  settings: Partial<UserSettings>;
  /** Callback to update settings in Firestore. */
  updateSettings: (newSettings: Partial<UserSettings>) => void;
}

const hours = Array.from({ length: 24 }, (_, i) => i);

/**
 * Formats a 24-hour integer into a 12-hour AM/PM string.
 */
const formatHour = (h: number) => {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12} ${ampm}`;
};

/**
 * Settings section for configuring the user's daily time blocks.
 * It manages start and end times for work and sleep, which are used by
 * the recommendation engine to avoid suggesting intense tasks during rest hours.
 *
 * @component
 */
export const TypicalScheduleSettings: React.FC<TypicalScheduleSettingsProps> = ({ settings, updateSettings }) => {
  return (
    <div className="space-y-3">
      {/* Work Schedule Configuration */}
      <div className="flex items-center gap-4 rounded-xl bg-surface p-3 border border-border hover:border-foreground/20 transition-colors">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-400/10 text-orange-400">
          <User size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">Work Schedule</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="relative group">
              <select 
                value={settings.workStartHour} 
                onChange={(e) => updateSettings({ workStartHour: Number(e.target.value) })}
                className="appearance-none bg-transparent border-b border-border text-xs text-foreground focus:border-primary outline-none cursor-pointer hover:border-foreground/30 py-0.5 pr-4"
              >
                {hours.map(h => <option key={h} value={h} className="bg-surface text-foreground">{formatHour(h)}</option>)}
              </select>
              <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xxs text-secondary pointer-events-none">▼</span>
            </div>
            <span className="text-xs text-secondary">to</span>
            <div className="relative group">
              <select 
                value={settings.workEndHour} 
                onChange={(e) => updateSettings({ workEndHour: Number(e.target.value) })}
                className="appearance-none bg-transparent border-b border-border text-xs text-foreground focus:border-primary outline-none cursor-pointer hover:border-foreground/30 py-0.5 pr-4"
              >
                {hours.map(h => <option key={h} value={h} className="bg-surface text-foreground">{formatHour(h)}</option>)}
              </select>
              <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xxs text-secondary pointer-events-none">▼</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sleep Routine Configuration */}
      <div className="flex items-center gap-4 rounded-xl bg-surface p-3 border border-border hover:border-foreground/20 transition-colors">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-400/10 text-blue-400">
          <BedDouble size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">Sleep Routine</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="relative group">
              <select 
                value={settings.sleepStartHour} 
                onChange={(e) => updateSettings({ sleepStartHour: Number(e.target.value) })}
                className="appearance-none bg-transparent border-b border-border text-xs text-foreground focus:border-primary outline-none cursor-pointer hover:border-foreground/30 py-0.5 pr-4"
              >
                {hours.map(h => <option key={h} value={h} className="bg-surface text-foreground">{formatHour(h)}</option>)}
              </select>
              <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xxs text-secondary pointer-events-none">▼</span>
            </div>
            <span className="text-xs text-secondary">to</span>
            <div className="relative group">
              <select 
                value={settings.sleepEndHour} 
                onChange={(e) => updateSettings({ sleepEndHour: Number(e.target.value) })}
                className="appearance-none bg-transparent border-b border-border text-xs text-foreground focus:border-primary outline-none cursor-pointer hover:border-foreground/30 py-0.5 pr-4"
              >
                {hours.map(h => <option key={h} value={h} className="bg-surface text-foreground">{formatHour(h)}</option>)}
              </select>
              <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xxs text-secondary pointer-events-none">▼</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
