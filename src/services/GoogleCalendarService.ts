'use client';

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from '@/firebase';

/**
 * Scopes required to interact with the Google Calendar API.
 * Includes readonly access to calendar lists and event details.
 */
const SCOPES = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events.readonly"
];

/**
 * Service for integrating with Google Calendar via OAuth.
 * Allows users to import their external schedules into the application
 * to better coordinate productivity with existing commitments.
 *
 * @singleton Use `GoogleCalendarService.getInstance()` to access the service.
 */
export class GoogleCalendarService {
  /** Singleton instance of the service. */
  private static instance: GoogleCalendarService;
  
  /**
   * Returns the singleton instance of GoogleCalendarService.
   * @returns The GoogleCalendarService instance.
   */
  static getInstance() {
    if (!this.instance) this.instance = new GoogleCalendarService();
    return this.instance;
  }

  /**
   * Triggers a Google OAuth popup to obtain an access token.
   *
   * @returns A promise resolving to the access token string or null.
   * @throws Error if the popup is blocked, the domain is not authorized, or the user cancels.
   */
  async getAccessToken(): Promise<string | null> {
    const provider = new GoogleAuthProvider();
    SCOPES.forEach(scope => provider.addScope(scope));

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (credential as any)?.accessToken || null;
    } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any;
        console.error("Calendar Auth Error:", error);
        
        if (err.code === 'auth/unauthorized-domain') {
            throw new Error("DOMAIN_NOT_AUTHORIZED");
        } else if (err.code === 'auth/operation-not-allowed') {
            throw new Error("GOOGLE_AUTH_NOT_ENABLED");
        } else if (err.code === 'auth/popup-closed-by-user') {
            throw new Error("POPUP_CLOSED");
        }
        
        throw err;
    }
  }

  /**
   * Fetches a list of all calendars accessible by the user.
   *
   * @param token - Valid Google OAuth access token.
   * @returns A promise resolving to an array of calendar metadata.
   */
  async fetchCalendarList(token: string): Promise<{ id: string; summary: string }[]> {
    try {
        const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error?.message || "Failed to fetch calendar list");
        }

        const data = await res.json();
        return data.items
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((item: any) => item.accessRole === 'owner' || item.accessRole === 'writer' || item.accessRole === 'reader')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((item: any) => ({ id: item.id, summary: item.summary }));
    } catch (e) {
        console.error("API Call Failed to list calendars", e);
        return [{ id: 'primary', summary: 'Primary Calendar' }];
    }
  }

  /**
   * Fetches upcoming events from one or more Google Calendars.
   *
   * @param token - Valid Google OAuth access token.
   * @param calendarIds - Array of calendar identifiers to query.
   * @param days - Number of days into the future to fetch events for (default 7).
   * @returns A promise resolving to a sorted array of unique calendar events.
   */
  async fetchUpcomingEvents(token: string, calendarIds: string[], days = 7) {
     const now = new Date();
     const end = new Date();
     end.setDate(now.getDate() + days);

     const params = new URLSearchParams({
         timeMin: now.toISOString(),
         timeMax: end.toISOString(),
         singleEvents: 'true',
         orderBy: 'startTime',
     });
     
     try {
        const eventPromises = calendarIds.map(id => 
            fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(id)}/events?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
        );

        const responses = await Promise.all(eventPromises);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let allEvents: any[] = [];

        for (const res of responses) {
            if (res.ok) {
                const data = await res.json();
                if (data.items) {
                    allEvents = allEvents.concat(data.items);
                }
            } else {
                console.warn(`Failed to fetch events for one calendar:`, await res.text());
            }
        }
        
        const uniqueEvents = Array.from(new Map(allEvents.map(event => [event.id, event])).values());

        uniqueEvents.sort((a, b) => {
            const timeA = new Date(a.start.dateTime || a.start.date).getTime();
            const timeB = new Date(b.start.dateTime || b.start.date).getTime();
            return timeA - timeB;
        });

        return uniqueEvents;

     } catch (e) {
         console.error("API Call Failed", e);
         throw e;
     }
  }

  /**
   * Generates a set of static mock events for development and demonstration purposes.
   */
  getMockEvents() {
    const baseNow = new Date();
    
    const getEventTime = (dayOffset: number, hour: number, minute: number) => {
        const d = new Date(baseNow);
        d.setDate(d.getDate() + dayOffset);
        d.setHours(hour, minute, 0, 0);
        return d.toISOString();
    };
    
    return [
      {
        id: 'mock-1',
        summary: 'Deep Work Session',
        description: 'Focus on coding tasks',
        status: 'confirmed',
        start: { dateTime: getEventTime(0, 10, 0) },
        end: { dateTime: getEventTime(0, 12, 0) }
      },
      {
        id: 'mock-2',
        summary: 'Team Sync',
        status: 'confirmed',
        start: { dateTime: getEventTime(0, 14, 0) },
        end: { dateTime: getEventTime(0, 14, 30) }
      },
      {
        id: 'mock-cancelled',
        summary: 'Cancelled Meeting',
        status: 'cancelled',
        start: { dateTime: getEventTime(0, 15, 0) },
        end: { dateTime: getEventTime(0, 15, 30) }
      },
      {
        id: 'mock-3',
        summary: 'Project Review',
        status: 'confirmed',
        start: { dateTime: getEventTime(1, 11, 0) },
        end: { dateTime: getEventTime(1, 12, 0) }
      },
      {
        id: 'mock-4',
        summary: 'Dentist Appointment',
        status: 'confirmed',
        start: { dateTime: getEventTime(1, 16, 0) },
        end: { dateTime: getEventTime(1, 17, 0) }
      },
      {
        id: 'mock-5',
        summary: 'All-Day Offsite',
        status: 'confirmed',
        start: { date: getEventTime(2, 0, 0).split('T')[0] },
        end: { date: getEventTime(2, 0, 0).split('T')[0] },
      }
    ];
  }
}
