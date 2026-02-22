# Roadmap: Advanced Google Calendar Integration

This document outlines a phased plan to significantly enhance the Google Calendar integration within Taskweave. The goal is to move from a simple event import to an intelligent, context-aware system that saves the user significant time and effort.

---

## Epic 1: Real-time Sync

This epic ensures that tasks created from calendar events stay up-to-date with their source. ONLY READ from calendar and do NOT WRITE.

-   **[ ] Feature: Store Event ID**
    -   **Specification:** When a Google Calendar event is imported, its unique Google Calendar `Event ID` will be stored in a new field on the Taskweave `Task` object, e.g., `googleCalendarEventId?: string`. This ID is the critical link between the two systems.
    -   **File to Edit:** `types.ts`
    -   **Implementation:**
        -   Add `googleCalendarEventId?: string;` to the `Task` interface.
        -   In `hooks/controllers/useCalendarImportController.ts`, ensure the `Event ID` is retrieved from the Google Calendar event and saved to this new field when a task is created.

-   **[ ] Feature: Background Sync Service**
    -   **Specification:** A new background service will be created. This service will periodically poll the Google Calendar API for changes to any events that have been imported into Taskweave (i.e., any tasks with a `googleCalendarEventId`).
    -   **File to Create:** `services/GoogleCalendarSyncService.ts`
    -   **Implementation:**
        -   Create a new `GoogleCalendarSyncService` class.
        -   This service will have a `sync` method that:
            1.  Fetches all tasks from Firestore that have a `googleCalendarEventId`.
            2.  For each task, it will use the Google Calendar API's `events.get` method to fetch the latest version of the event.
            3.  It will then compare the event data with the task data and update the task if necessary.
        -   This `sync` method should be invoked periodically. A good place to trigger this would be in `context/AppProvider.tsx` within a `useEffect` hook with a timer.

-   **[ ] Feature: Update Task Properties**
    -   **Specification:** When a change is detected, the background service will update the corresponding Taskweave task with the new information. This includes changes to the event's `summary` (task title), `description` (task notes), `start` and `end` times, and `recurrence` rules.
    -   **File to Edit:** `services/GoogleCalendarSyncService.ts`
    -   **Implementation:**
        -   Inside the `sync` method, after fetching the event, compare the following fields:
            -   `summary` -> `title`
            -   `description` -> `notes`
            -   `start` (`dateTime` or `date`) & `timeZone` -> `startTime`
            -   `end` (`dateTime` or `date`) & `timeZone` -> `endTime`
            -   `recurrence` -> `recurrence`
        -   If any of these have changed, update the task in Firestore using the `TaskService`.

-   **[ ] Feature: Handle Deleted Events**
    -   **Specification:** If the background service detects that a Google Calendar event has been deleted (i.e., it's no longer returned by the API), it will mark the corresponding Taskweave task as `archived`. This prevents data loss and allows for the possibility of restoring the task if the calendar event is restored.
    -   **File to Edit:** `services/GoogleCalendarSyncService.ts`
    -   **Implementation:**
        -   When using `events.get`, if the API returns a `404 Not Found` error, it means the event has been deleted.
        -   In this case, update the `isArchived` property of the corresponding task to `true`.

## Epic 2: Calendar-to-Project Mapping

This epic introduces a powerful new feature allowing users to define explicit relationships between their various calendars and their Taskweave projects.

-   **[ ] Feature: New Settings UI for Mappings**
    -   **Specification:** A new section titled "Calendar to Project Mapping" will be added to the `SettingsView`. This UI will fetch and display a list of all the user's Google Calendars by name. Next to each calendar name, a dropdown menu will be populated with a list of the user's Taskweave projects, plus a default "Inbox" option.
    -   **File to Edit:** `views/SettingsView.tsx`
    -   **UI Implementation:**
        -   Create a new component, `CalendarMappingRow`, that takes a calendar and a list of projects as props.
        -   In `SettingsView`, fetch the list of calendars using the `GoogleCalendarService`.
        -   Fetch the list of projects from the `TaskContext`.
        -   Render a `CalendarMappingRow` for each calendar.
        -   The `CalendarMappingRow` will display the calendar name and a dropdown (`<select>`) containing the projects. The dropdown should show the currently saved mapping for that calendar.
        -   When a new project is selected from the dropdown, an `onChange` handler will be triggered to save the new mapping.

-   **[ ] Feature: Store Mappings in Firestore**
    -   **Specification:** When a user selects a project for a calendar, this mapping will be saved to the user's settings document in Firestore.
    -   **File to Edit:** `types.ts`, `services/UserConfigService.ts`
    -   **Implementation:**
        -   In `types.ts`, add a new field to the `UserSettings` interface: `calendarProjectMapping?: { [calendarId: string]: string; }`. The key will be the Google Calendar ID, and the value will be the Taskweave Project ID.
        -   In `UserConfigService.ts`, create a new method `updateCalendarMapping(calendarId: string, projectId: string)` that updates this mapping in the user's settings document in Firestore.

-   **[ ] Feature: Use Mappings During Import**
    -   **Specification:** The `useCalendarImportController` will be updated to fetch and use these stored mappings. When importing events, the controller will check the source calendar ID for each event. If a mapping exists for that ID, assign the task to the corresponding project. If no mapping exists, it will revert to the "Smarter Fallback" logic.
    -   **File to Edit:** `hooks/controllers/useCalendarImportController.ts`
    -   **Implementation:**
        -   In the `importEvents` function, before creating a task, retrieve the user's `calendarProjectMapping` from the `UserConfigService`.
        -   For each event, check if a mapping exists for the `calendarId`.
        -   If a mapping exists, set the `projectId` of the new task to the one from the mapping.
        -   If not, proceed with the existing fallback logic.

## Epic 3: Foundational Import Enhancements

This epic focuses on making the initial import process more intelligent and useful by extracting more context from each calendar event.

-   **[ ] Feature: Enhanced Time & Date Handling**
    -   **Specification:** The import logic must correctly handle both timed events and all-day events. It must also preserve timezone information to ensure accuracy.
    -   **File to Edit:** `hooks/controllers/useCalendarImportController.ts`
    -   **Implementation:**
        -   When processing an event, check for the existence of `start.dateTime`. If it exists, use it and the associated `timeZone` field.
        -   If `start.dateTime` does not exist, use `start.date`. This indicates an all-day event. The task's `startTime` and `endTime` should be set to the beginning and end of that day, respectively, in the user's local timezone.
        -   Store the `timeZone` from the Google Calendar event in a new `timeZone?: string` field on the Taskweave `Task` object to ensure consistency across timezones. Add this field to the `Task` interface in `types.ts`.

-   **[ ] Feature: Robust Recurrence Support**
    -   **Specification:** The import logic in `useCalendarImportController.ts` will be updated to parse `recurrence` rules from Google Calendar events.
    -   **File to Edit:** `hooks/controllers/useCalendarImportController.ts`
    -   **Implementation:**
        -   Create a utility function that converts a Google Calendar `RRULE` string into a Taskweave `RecurrenceConfig` object.
        -   **Note:** `RRULE` can be complex. The initial implementation should focus on common patterns (e.g., `DAILY`, `WEEKLY`, `MONTHLY`). More complex rules can be added in a future iteration. Log a warning for any recurrence rules that are not successfully parsed.
        -   In the `importEvents` function, if an event has a `recurrence` rule, use this utility function to convert it and set the `recurrence` property of the new task.

-   **[ ] Feature: Contextual Notes**
    -   **Specification:** The import process will be enhanced to extract `location` and `conferenceData` (e.g., Google Meet links) from the calendar event. This information will be appended to the `notes` field of the newly created Taskweave task.
    -   **File to Edit:** `hooks/controllers/useCalendarImportController.ts`
    -   **Implementation:**
        -   In the `importEvents` function, for each event, check for the `location` and `conferenceData` fields.
        -   If `location` exists, append it to the task's `notes`.
        -   If `conferenceData` exists, format the meeting link and append it to the `notes`. For example: `\nMeeting Link: [link]`.

-   **[ ] Feature: Smarter & Unambiguous Fallback Project Assignment**
    -   **Specification:** The default behavior will be a three-step fallback: 1. Explicit Mapping, 2. Unambiguous Keyword Match, 3. Inbox Default.
    -   **File to Edit:** `hooks/controllers/useCalendarImportController.ts`
    -   **Implementation:**
        -   After checking for an explicit mapping, implement a keyword search.
        -   Iterate through the user's projects and find all project names contained in the event `summary` (case-insensitive).
        -   **Ambiguity Resolution:** If exactly one project name is matched, assign the task to that project. If multiple project names are matched, do not assign a project and proceed to the next step.
        -   If no match is found or ambiguity is detected, assign the task to the Inbox.
