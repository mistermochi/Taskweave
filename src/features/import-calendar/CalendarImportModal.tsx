'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { CalendarEvent } from '@/hooks/controllers/useCalendarImportController';
import { Modal } from '@/shared/ui/dialog';
import { EmptyState } from '@/shared/ui/Feedback';
import { TaskRow } from '@/entities/task';
import { Tag } from '@/entities/tag';
import { TaskEntity, EnergyLevel } from '@/entities/task';
import { UserSettings } from '@/types';
import { Button } from '@/shared/ui/button';

/**
 * Interface for CalendarImportModal props.
 */
interface CalendarImportModalProps {
  /** Whether the modal is currently visible. */
  isOpen: boolean;
  /** Callback to close the modal. */
  onClose: () => void;
  /** List of calendar events fetched from Google. */
  events: CalendarEvent[];
  /** List of user tags for project mapping. */
  tags: Tag[];
  /** User settings for default mappings. */
  settings: Partial<UserSettings>;
  /** Set of IDs for tasks already imported (to prevent duplicates). */
  importedIds: Set<string>;
  /** Callback to finalize the import of selected events. */
  onImport: (tasks: TaskEntity[]) => void;
}

/**
 * Helper function to map a raw calendar event into a preview TaskEntity.
 */
const eventToTaskPreview = (event: CalendarEvent, tags: Tag[], settings: Partial<UserSettings>, isImported: boolean): TaskEntity => {
    const calendarId = event.calendarId;
    const mappedTagId = settings.calendarProjectMapping?.[calendarId] || '';

    return {
      id: event.id,
      title: event.summary,
      category: mappedTagId,
      status: isImported ? 'completed' : 'active',
      duration: event.end && event.start ? Math.round((event.end - event.start) / 60000) : 30,
      energy: 'Medium' as EnergyLevel,
      createdAt: Date.now(),
      assignedDate: event.start,
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
    onClose,
    events,
    tags,
    settings,
    importedIds,
    onImport
}) => {
  const [selectedEvents, setSelectedEvents] = React.useState<Set<string>>(new Set());

  const toggleEvent = (id: string) => {
    const next = new Set(selectedEvents);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedEvents(next);
  };

  const handleImport = () => {
    const tasksToImport = events
        .filter(e => selectedEvents.has(e.id))
        .map(e => eventToTaskPreview(e, tags, settings, false));
    onImport(tasksToImport);
    onClose();
  };

  return (
    <Modal.Root isOpen={isOpen} onClose={onClose}>
      <Modal.Header
        title={
            <div className="flex items-center gap-2">
                <Calendar size={20} className="text-primary" />
                <span>Import from Calendar</span>
            </div>
        }
        onClose={onClose}
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
                const isAlreadyImported = importedIds.has(event.id);
                const taskPreview = eventToTaskPreview(event, tags, settings, isAlreadyImported);

                return (
                    <TaskRow
                        key={event.id}
                        task={taskPreview}
                        allTasks={[]}
                        tags={tags}
                        onComplete={() => {}}
                        onFocus={() => {}}
                        isSelected={selectedEvents.has(event.id)}
                        onSelect={isAlreadyImported ? undefined : (t) => toggleEvent(t.id)}
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
                onClick={onClose}
                className="flex-1 h-11 font-bold"
            >
                Cancel
            </Button>
            <Button
                onClick={handleImport}
                disabled={selectedEvents.size === 0}
                className="flex-1 h-11 font-bold"
            >
                Import {selectedEvents.size} {selectedEvents.size === 1 ? 'Event' : 'Events'}
            </Button>
        </div>
      </Modal.Footer>
    </Modal.Root>
  );
};
