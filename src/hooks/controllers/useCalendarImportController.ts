import { useState, useEffect } from 'react';
import { GoogleCalendarService } from '@/services/GoogleCalendarService';
import { TaskService } from '@/services/TaskService';
import { tagApi, Tag } from '@/entities/tag';
import { UserSettings } from '@/entities/user';
import { TaskEntity } from '@/types';

/**
 * Interface representing a standardized calendar event structure.
 */
export interface CalendarEvent {
    id: string;
    summary: string;
    description?: string;
    location?: string;
    conferenceData?: { entryPoints?: { uri?: string }[] };
    start: { dateTime?: string; date?: string; timeZone?: string; };
    end: { dateTime?: string; date?: string; timeZone?: string; };
    status?: string;
    organizer: { email: string };
    calendarId: string; 
}

/**
 * View Controller for the Google Calendar Import workflow.
 * Manages the OAuth flow, event fetching, selection, and mapping to application tasks.
 *
 * @param settings - Current user settings (to retrieve enabled calendars and project mappings).
 * @param allTasks - Current application tasks (to detect duplicate imports).
 * @returns State (loading status, events) and Actions (start, toggle, confirm, cancel).
 */
export const useCalendarImportController = (settings: Partial<UserSettings>, allTasks: TaskEntity[]) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    /** Set of IDs for events already successfully imported as tasks. */
    const [importedEventIds, setImportedEventIds] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [tags, setTags] = useState<Tag[]>([]);

    useEffect(() => {
        const fetchTags = async () => {
            const userTags = await tagApi.getTags();
            setTags(userTags);
        };
        fetchTags();
    }, []);

    /**
     * Initiates the OAuth flow and fetches upcoming events from the user's enabled calendars.
     */
    const startImport = async () => {
        setIsLoading(true);
        setError(null);
        
        const alreadyImported = new Set(allTasks.map(t => t.googleCalendarEventId).filter(Boolean) as string[]);
        setImportedEventIds(alreadyImported);

        const service = GoogleCalendarService.getInstance();

        const calendarIds = settings.enabledCalendars || [];
        if (calendarIds.length === 0) {
            setError("No calendars enabled for import. Please select at least one in settings.");
            setIsLoading(false);
            return;
        }

        try {
            const token = await service.getAccessToken();
            
            if (token) {
                const fetched = await service.fetchUpcomingEvents(token, calendarIds);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const validEvents = fetched.filter((e: any) => e.status !== 'cancelled').map(e => ({...e, calendarId: e.organizer.email}));
                setupEvents(validEvents, alreadyImported);
                setIsOpen(true);
            } else {
                throw new Error("No token received");
            }
        } catch (e: unknown) {
            const error = e as Error;
            console.error("Import failed:", error);
            
            // Fallback to Demo/Mock data if Auth fails (e.g. during dev/testing)
            if (error.message === 'DOMAIN_NOT_AUTHORIZED' || error.message === 'GOOGLE_AUTH_NOT_ENABLED' || error.message === 'POPUP_CLOSED') {
                setError("Demo Mode (Auth Config Missing)");
                const mocks = service.getMockEvents() as CalendarEvent[];
                const mockEventsWithIds = mocks.map((e, i) => ({ ...e, calendarId: i % 2 === 0 ? 'primary' : 'work@example.com' }));
                const filteredMocks = mockEventsWithIds.filter(e => calendarIds.includes(e.calendarId));
                setupEvents(filteredMocks, alreadyImported);
                setIsOpen(true);
            } else {
                setError(error.message || "Failed to connect");
            }
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Populates the internal event list and pre-selects new items.
     */
    const setupEvents = (fetchedEvents: CalendarEvent[], alreadyImported: Set<string>) => {
        setEvents(fetchedEvents);
        const allNewIds = new Set(fetchedEvents.map((e) => e.id).filter(id => !alreadyImported.has(id)));
        setSelectedIds(allNewIds);
    };

    /**
     * Toggles the selection status of a specific event ID.
     */
    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    /**
     * Finalizes the import by converting selected events into tasks.
     * Maps calendar fields (title, desc, duration) to task entities.
     *
     * @param onSuccess - Callback containing the count of imported tasks.
     */
    const confirmImport = async (onSuccess: (count: number) => void) => {
        const taskService = TaskService.getInstance();
        const eventsToImport = events.filter(e => selectedIds.has(e.id));
        
        for (const event of eventsToImport) {
            let duration = 30;
            let dueDate: number | undefined = undefined;
            const timeZone = event.start.timeZone;

            if (event.start.dateTime && event.end.dateTime) {
                const start = new Date(event.start.dateTime).getTime();
                const end = new Date(event.end.dateTime).getTime();
                duration = Math.max(15, Math.round((end - start) / 60000));
                dueDate = start;
            } else if (event.start.date) {
                const d = new Date(event.start.date);
                dueDate = d.getTime();
                duration = 30;
            }

            const lowerSummary = event.summary.toLowerCase();
            let energy = 50;
            if (lowerSummary.includes('meeting') || lowerSummary.includes('sync')) energy = 60;
            if (lowerSummary.includes('focus') || lowerSummary.includes('deep')) energy = 80;
            if (lowerSummary.includes('lunch') || lowerSummary.includes('break')) energy = 20;

            let notes = event.description || "";
            if (event.location) {
                notes += `\n\nLocation: ${event.location}`;
            }
            if (event.conferenceData?.entryPoints?.[0]?.uri) {
                notes += `\n\nMeeting Link: ${event.conferenceData.entryPoints[0].uri}`;
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

            const newTaskId = await taskService.addTask(
                event.summary,
                projectId, 
                duration,
                energy,
                notes.trim() || "Imported from Google Calendar",
                dueDate,
                undefined
            );

            if (newTaskId) {
                await taskService.updateTask(newTaskId, {
                    googleCalendarEventId: event.id,
                    googleCalendarId: calendarId,
                    timeZone: timeZone
                });
            }
        }
        
        onSuccess(eventsToImport.length);
        setIsOpen(false);
    };

    /**
     * Resets the import state.
     */
    const cancelImport = () => {
        setIsOpen(false);
        setEvents([]);
        setError(null);
    };

    return {
        state: {
            isOpen,
            isLoading,
            events,
            selectedIds,
            error,
            importedEventIds
        },
        actions: {
            startImport,
            toggleSelection,
            confirmImport,
            cancelImport
        }
    };
};
