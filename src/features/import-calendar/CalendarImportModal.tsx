'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { CalendarEvent } from '@/hooks/controllers/useCalendarImportController';
import { Modal } from '@/shared/ui/ui/dialog';
import { EmptyState } from '@/shared/ui/ui/Feedback';
import { TaskRow } from '@/entities/task';
import { Tag } from '@/entities/tag';
import { TaskEntity, EnergyLevel } from '@/entities/task';
import { UserSettings } from '@/types';
import { Button } from '@/shared/ui/ui/button';

/**
 * Interface for CalendarImportModal props.
 */
interface CalendarImportModalProps {
  /** Whether the modal is currently visible. */
  isOpen: boolean;
  /** List of calendar events fetched from Google. */
  events: CalendarEvent[];
  /** List of user tags for project mapping. */
  tags: Tag[];
  /** User settings for default mappings. */
  settings: Partial<UserSettings>;
  /** Set of IDs of currently selected events. */
  selectedIds: Set<string>;
  /** Set of IDs for tasks already imported (to prevent duplicates). */
  importedEventIds: Set<string>;
  /** Callback to toggle event selection. */
  onToggle: (id: string) => void;
  /** Callback to finalize the import of selected events. */
  onConfirm: () => void;
  /** Callback to cancel the import process. */
  onCancel: () => void;
}

/**
 * Helper function to map a raw calendar event into a preview TaskEntity.
 */
const eventToTaskPreview = (event: CalendarEvent, tags: Tag[], settings: Partial<UserSettings>, isImported: boolean): TaskEntity => {
    const calendarId = event.calendarId;
    const mappedTagId = settings.calendarProjectMapping?.[calendarId] || '';

    let duration = 30;
    let assignedDate: number | undefined = undefined;

    if (event.start.dateTime && event.end.dateTime) {
        const start = new Date(event.start.dateTime).getTime();
        const end = new Date(event.end.dateTime).getTime();
        duration = Math.round((end - start) / 60000);
        assignedDate = start;
    } else if (event.start.date) {
        assignedDate = new Date(event.start.date).getTime();
    }

    return {
      id: event.id,
      title: event.summary,
      category: mappedTagId,
      status: isImported ? 'completed' : 'active',
      duration,
      energy: 'Medium' as EnergyLevel,
      createdAt: Date.now(),
      assignedDate,
      googleCalendarEventId: event.id,
      googleCalendarId: event.calendarId,
      blockedBy: [],
    } as TaskEntity;
};

/**
 * Modal for reviewing and importing events from Google Calendar.
 * Displays events as a list of "Ghost" tasks that the user can tweak before
 * committing them to their actual task list.
 *
 * @component
 */
export const CalendarImportModal: React.FC<CalendarImportModalProps> = ({
    isOpen,
    events,
    tags,
    settings,
    selectedIds,
    importedEventIds,
    onToggle,
    onConfirm,
    onCancel
}) => {
  return (
    <Modal.Root isOpen={isOpen} onClose={onCancel}>
      <Modal.Header
        title={
            <div className="flex items-center gap-2">
                <Calendar size={20} className="text-primary" />
                <span>Import from Calendar</span>
            </div>
        }
        onClose={onCancel}
      />
      <Modal.Content>
        {events.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No events found"
            message="We couldn't find any upcoming events in your enabled calendars."
          />
        ) : (
          <div className="space-y-1">
            <p className="text-xs text-secondary font-medium mb-4 uppercase tracking-wider">Select events to add to your plan</p>
            {events.map(event => {
                const isAlreadyImported = importedEventIds.has(event.id);
                const taskPreview = eventToTaskPreview(event, tags, settings, isAlreadyImported);

                return (
                    <TaskRow
                        key={event.id}
                        task={taskPreview}
                        allTasks={[]}
                        tags={tags}
                        onComplete={() => {}}
                        onFocus={() => {}}
                        isSelected={selectedIds.has(event.id)}
                        onSelect={isAlreadyImported ? undefined : (t) => onToggle(t.id)}
                    />
                );
            })}
          </div>
        )}
      </Modal.Content>
      <Modal.Footer>
        <div className="flex gap-3 w-full">
            <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1 h-11 font-bold"
            >
                Cancel
            </Button>
            <Button
                onClick={onConfirm}
                disabled={selectedIds.size === 0}
                className="flex-1 h-11 font-bold"
            >
                Import {selectedIds.size} {selectedIds.size === 1 ? 'Event' : 'Events'}
            </Button>
        </div>
      </Modal.Footer>
    </Modal.Root>
  );
};
