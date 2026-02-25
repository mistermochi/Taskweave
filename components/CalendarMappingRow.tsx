'use client';

import React from 'react';
import { Tag } from '@/types';

/**
 * Interface for CalendarMappingRow props.
 */
interface CalendarMappingRowProps {
    /** The Google Calendar object containing ID and summary. */
    calendar: { id: string; summary: string };
    /** All available user tags for mapping. */
    projects: Tag[];
    /** The currently mapped project (tag) ID. */
    selectedProject: string;
    /** Callback for when the mapping is updated. */
    onMappingChange: (calendarId: string, projectId: string) => void;
    /** Whether synchronization is enabled for this calendar. */
    isEnabled: boolean;
    /** Callback to toggle synchronization for this calendar. */
    onToggleEnabled: (calendarId: string) => void;
}

/**
 * A specialized UI row for mapping an external Google Calendar to an internal Tag.
 * This ensures that imported events are automatically categorized correctly.
 *
 * @component
 */
export const CalendarMappingRow: React.FC<CalendarMappingRowProps> = ({
    calendar,
    projects,
    selectedProject,
    onMappingChange,
    isEnabled,
    onToggleEnabled
}) => {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0 gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
            <input
                type="checkbox"
                checked={isEnabled}
                onChange={() => onToggleEnabled(calendar.id)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-foreground/5"
            />
            <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-foreground truncate">{calendar.summary}</span>
                <span className="text-[10px] text-secondary/50 font-mono truncate">{calendar.id}</span>
            </div>
        </div>
        <div className="relative shrink-0">
            <select 
                value={selectedProject}
                onChange={(e) => onMappingChange(calendar.id, e.target.value)}
                className="bg-foreground/5 border border-border rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary appearance-none pr-8 cursor-pointer max-w-[150px]"
            >
                <option value="">No Project Mapping</option>
                {projects.map(tag => (
                    <option key={tag.id} value={tag.id}>{tag.name}</option>
                ))}
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-secondary pointer-events-none">▼</span>
        </div>
    </div>
  );
};
