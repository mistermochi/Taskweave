"use client";

import React from 'react';
import { Tag } from '@/entities/tag';
import { Checkbox } from "@/shared/ui/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/ui/select";

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
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
            <Checkbox
                checked={isEnabled}
                onCheckedChange={() => onToggleEnabled(calendar.id)}
                className="scale-90"
            />
            <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-medium text-foreground truncate">{calendar.summary}</span>
                <span className="text-[9px] text-muted-foreground font-mono truncate">{calendar.id}</span>
            </div>
        </div>
        <div className="shrink-0">
            <Select
                value={selectedProject}
                onValueChange={(value) => onMappingChange(calendar.id, value)}
            >
                <SelectTrigger className="h-7 text-[10px] min-w-[110px] max-w-[140px]">
                    <SelectValue placeholder="No Project" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none" className="text-[10px]">No Project</SelectItem>
                    {projects.map(tag => (
                        <SelectItem key={tag.id} value={tag.id} className="text-[10px]">{tag.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    </div>
  );
};
