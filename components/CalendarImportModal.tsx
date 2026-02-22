'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { CalendarEvent } from '@/hooks/controllers/useCalendarImportController';
import { Modal } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/Feedback';
import { TaskRow } from '@/components/TaskRow';
import { TaskEntity, Tag, UserSettings, EnergyLevel } from '@/types';

interface CalendarImportModalProps {
  isOpen: boolean;
  events: CalendarEvent[];
  selectedIds: Set<string>;
  importedEventIds: Set<string>; // Add new prop
  onToggle: (id: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  tags: Tag[];
  settings: Partial<UserSettings>;
}

// This helper converts a Google Calendar event into a TaskEntity for preview purposes.
const eventToTaskPreview = (event: CalendarEvent, tags: Tag[], settings: Partial<UserSettings>, isImported: boolean): TaskEntity => {
    let duration = 30;
    let dueDate: number | undefined = undefined;

    if (event.start.dateTime && event.end.dateTime) {
        const start = new Date(event.start.dateTime).getTime();
        const end = new Date(event.end.dateTime).getTime();
        duration = Math.max(15, Math.round((end - start) / 60000));
        dueDate = start;
    } else if (event.start.date) {
        const d = new Date(event.start.date);
        dueDate = d.setHours(12, 0, 0, 0);
        duration = 30;
    }

    const lowerSummary = event.summary.toLowerCase();
    let energy: EnergyLevel = 'Medium';
    if (lowerSummary.includes('focus') || lowerSummary.includes('deep')) energy = 'High';
    if (lowerSummary.includes('lunch') || lowerSummary.includes('break')) energy = 'Low';

    let notes = event.description || "";
    if (event.location) notes += `\n\nLocation: ${event.location}`;
    if (event.conferenceData?.entryPoints?.[0]?.uri) notes += `\n\nMeeting Link: ${event.conferenceData.entryPoints[0].uri}`;

    if (isImported) {
        notes = "Already imported into Taskweave";
    }

    let projectId = '';
    const calendarId = event.calendarId;
    if (settings.calendarProjectMapping && settings.calendarProjectMapping[calendarId]) {
        projectId = settings.calendarProjectMapping[calendarId];
    } else {
        const matchingTags = tags.filter(tag => lowerSummary.includes(tag.name.toLowerCase()));
        if (matchingTags.length === 1) {
            projectId = matchingTags[0].id;
        }
    }
    
    return {
        id: event.id,
        title: event.summary || 'Untitled Event',
        notes: notes.trim(),
        status: isImported ? 'completed' : 'active', // Use 'completed' status to get disabled look
        category: projectId,
        duration,
        energy,
        dueDate,
        createdAt: Date.now(),
        blockedBy: [],
    } as TaskEntity;
};

export const CalendarImportModal: React.FC<CalendarImportModalProps> = ({ 
    isOpen, 
    events, 
    selectedIds, 
    importedEventIds, // Use new prop
    onToggle, 
    onConfirm, 
    onCancel,
    tags,
    settings
}) => {
  const getDayLabel = (event: CalendarEvent) => {
      const d = new Date(event.start.dateTime || event.start.date || Date.now());
      const today = new Date();
      if (d.getDate() === today.getDate() && d.getMonth() === today.getMonth()) return "Today";
      
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      if (d.getDate() === tomorrow.getDate() && d.getMonth() === tomorrow.getMonth()) return "Tomorrow";

      return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const groupedEvents: { [key: string]: CalendarEvent[] } = {};
  events.forEach(e => {
      const label = getDayLabel(e);
      if (!groupedEvents[label]) groupedEvents[label] = [];
      groupedEvents[label].push(e);
  });

  return (
    <Modal.Root isOpen={isOpen} onClose={onCancel}>
        <Modal.Header 
            title={
                <div className="flex items-center gap-2 text-foreground">
                    <Calendar size={20} className="text-primary" />
                    <span>Select Events to Import</span>
                </div>
            }
            onClose={onCancel}
        />

        <Modal.Content>
            {events.length === 0 ? (
                <EmptyState 
                    title="No upcoming events" 
                    message="We couldn't find any events in the next few days on your selected calendars."
                />
            ) : (
                Object.keys(groupedEvents).map(day => (
                    <div key={day} className="mb-6 last:mb-0">
                        <h3 className="text-xxs font-bold uppercase tracking-widest text-secondary/50 mb-1 sticky top-0 bg-surface py-2 z-10">
                            {day}
                        </h3>
                        <div className="space-y-1">
                            {groupedEvents[day].map(event => {
                                const isImported = importedEventIds.has(event.id);
                                const isSelected = selectedIds.has(event.id);
                                const taskPreview = eventToTaskPreview(event, tags, settings, isImported);
                                return (
                                    <TaskRow
                                        key={event.id}
                                        task={taskPreview}
                                        tags={tags}
                                        allTasks={[]}
                                        onComplete={() => {}}
                                        onFocus={() => {}}
                                        isSelected={isSelected}
                                        // Disable selection for already imported tasks
                                        onSelect={isImported ? undefined : () => onToggle(event.id)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))
            )}
        </Modal.Content>

        <Modal.Footer>
            <button 
                onClick={onConfirm}
                disabled={selectedIds.size === 0}
                className="w-full bg-primary hover:bg-primary-dim text-background font-bold text-sm h-12 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span>Import {selectedIds.size > 0 ? selectedIds.size : ''} Tasks</span>
            </button>
        </Modal.Footer>
    </Modal.Root>
  );
};
