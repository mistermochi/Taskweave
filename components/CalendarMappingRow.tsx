
import React from 'react';
import { Tag } from '@/types';

interface CalendarMappingRowProps {
  calendar: { id: string; summary: string };
  projects: Tag[];
  selectedProject: string;
  onMappingChange: (calendarId: string, projectId: string) => void;
  isEnabled: boolean;
  onToggleEnabled: (calendarId: string) => void;
}

export const CalendarMappingRow: React.FC<CalendarMappingRowProps> = ({ calendar, projects, selectedProject, onMappingChange, isEnabled, onToggleEnabled }) => {
  return (
    <div className={`flex items-center gap-3 p-3 bg-surface-highlight rounded-xl border border-border transition-all ${!isEnabled ? 'opacity-60' : 'hover:border-foreground/20'}`}>
        <input 
            type="checkbox" 
            id={`calendar-${calendar.id}`}
            checked={isEnabled}
            onChange={() => onToggleEnabled(calendar.id)}
            className="h-4 w-4 rounded border-border bg-surface text-primary focus:ring-primary focus:ring-offset-surface-highlight"
        />
        <label htmlFor={`calendar-${calendar.id}`} className="text-sm font-medium text-foreground flex-1 cursor-pointer truncate">{calendar.summary}</label>
        <div className="relative group">
            <select 
                value={selectedProject} 
                onChange={(e) => onMappingChange(calendar.id, e.target.value)}
                disabled={!isEnabled}
                className="appearance-none bg-transparent border-b border-border text-xs text-foreground focus:border-primary outline-none cursor-pointer hover:border-foreground/30 py-0.5 pr-4 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <option value="">Inbox</option>
                {projects.map(p => <option key={p.id} value={p.id} className="bg-surface text-foreground">{p.name}</option>)}
            </select>
            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xxs text-secondary pointer-events-none">▼</span>
        </div>
    </div>
  );
};
