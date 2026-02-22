
import { useState, useEffect } from 'react';
import { GoogleCalendarService } from '@/services/GoogleCalendarService';
import { TaskService } from '@/services/TaskService';
import { TagService } from '@/services/TagService';
import { Tag, UserSettings, TaskEntity } from '@/types'; // Import TaskEntity

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

export const useCalendarImportController = (settings: Partial<UserSettings>, allTasks: TaskEntity[]) => { // Accept allTasks
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [importedEventIds, setImportedEventIds] = useState<Set<string>>(new Set()); // New state
    const [error, setError] = useState<string | null>(null);
    const [tags, setTags] = useState<Tag[]>([]);

    useEffect(() => {
        const fetchTags = async () => {
            const tagService = TagService.getInstance();
            const userTags = await tagService.getTags();
            setTags(userTags);
        };
        fetchTags();
    }, []);

    const startImport = async () => {
        setIsLoading(true);
        setError(null);
        
        // Build a set of already imported event IDs
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
                const validEvents = fetched.filter((e: any) => e.status !== 'cancelled').map(e => ({...e, calendarId: e.organizer.email})); // Add calendarId
                setupEvents(validEvents, alreadyImported); // Pass alreadyImported
                setIsOpen(true);
            } else {
                throw new Error("No token received");
            }
        } catch (e: unknown) {
            const error = e as Error;
            console.error("Import failed:", error);
            
            if (error.message === 'DOMAIN_NOT_AUTHORIZED' || error.message === 'GOOGLE_AUTH_NOT_ENABLED' || error.message === 'POPUP_CLOSED') {
                setError("Demo Mode (Auth Config Missing)");
                const mocks = service.getMockEvents() as CalendarEvent[];
                const mockEventsWithIds = mocks.map((e, i) => ({ ...e, calendarId: i % 2 === 0 ? 'primary' : 'work@example.com' }));
                const filteredMocks = mockEventsWithIds.filter(e => calendarIds.includes(e.calendarId));
                setupEvents(filteredMocks, alreadyImported); // Pass alreadyImported
                setIsOpen(true);
            } else {
                setError(error.message || "Failed to connect");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const setupEvents = (fetchedEvents: CalendarEvent[], alreadyImported: Set<string>) => {
        setEvents(fetchedEvents);
        // Pre-select only events that have not been imported yet
        const allNewIds = new Set(fetchedEvents.map((e) => e.id).filter(id => !alreadyImported.has(id)));
        setSelectedIds(allNewIds);
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

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
            importedEventIds // Expose the new state
        },
        actions: {
            startImport,
            toggleSelection,
            confirmImport,
            cancelImport
        }
    };
};
