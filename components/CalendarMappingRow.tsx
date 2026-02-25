'use client';

import React from 'react';
import { Tag } from '@/types';

/**
 * Interface for CalendarMappingRow props.
 */
interface CalendarMappingRowProps {
    /** The summary/name of the Google Calendar. */
    calendarSummary: string;
    /** The ID of the Google Calendar. */
    calendarId: string;
    /** The currently mapped project (tag) ID. */
    mappedProjectId: string;
    /** All available user tags for mapping. */
    allTags: Tag[];
    /** Callback for when the mapping is updated. */
    onUpdateMapping: (calendarId: string, projectId: string) => void;
}

/**
 * A specialized UI row for mapping an external Google Calendar to an internal Tag.
 * This ensures that imported events are automatically categorized correctly.
 *
 * @component
 */
export const CalendarMappingRow: React.FC<CalendarMappingRowProps> = ({
    calendarSummary,
    calendarId,
    mappedProjectId,
    allTags,
    onUpdateMapping,
}) => {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
        <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{calendarSummary}</span>
            <span className="text-[10px] text-secondary/50 font-mono">{calendarId}</span>
        </div>
        <div className="relative">
            <select 
                value={mappedProjectId}
                onChange={(e) => onUpdateMapping(calendarId, e.target.value)}
                className="bg-foreground/5 border border-border rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary appearance-none pr-8 cursor-pointer"
            >
                <option value="">No Project Mapping</option>
                {allTags.map(tag => (
                    <option key={tag.id} value={tag.id}>{tag.name}</option>
                ))}
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-secondary pointer-events-none">▼</span>
        </div>
    </div>
  );
};
