'use client';

import { GoogleAuthProvider, signInWithPopup, UserCredential } from "firebase/auth";
import { auth } from '@/firebase'; // Import the shared auth instance

// Added .readonly to be able to list calendars
const SCOPES = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events.readonly"
];

export class GoogleCalendarService {
  private static instance: GoogleCalendarService;
  
  static getInstance() {
    if (!this.instance) this.instance = new GoogleCalendarService();
    return this.instance;
  }

  async getAccessToken(): Promise<string | null> {
    const provider = new GoogleAuthProvider();
    // Add all required scopes
    SCOPES.forEach(scope => provider.addScope(scope));

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      return credential?.accessToken || null;
    } catch (error: any) {
        console.error("Calendar Auth Error:", error);
        
        if (error.code === 'auth/unauthorized-domain') {
            throw new Error("DOMAIN_NOT_AUTHORIZED");
        } else if (error.code === 'auth/operation-not-allowed') {
            throw new Error("GOOGLE_AUTH_NOT_ENABLED");
        } else if (error.code === 'auth/popup-closed-by-user') {
            throw new Error("POPUP_CLOSED");
        }
        
        throw error;
    }
  }

  // New method to fetch the list of calendars
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
        // Filter for calendars the user can read and wants to see, and return their IDs
        return data.items
            .filter((item: any) => item.accessRole === 'owner' || item.accessRole === 'writer' || item.accessRole === 'reader')
            .map((item: any) => ({ id: item.id, summary: item.summary }));
    } catch (e) {
        console.error("API Call Failed to list calendars", e);
        // Fallback to primary if the list fails
        return [{ id: 'primary', summary: 'Primary Calendar' }];
    }
  }

  // Updated to fetch events from multiple calendars
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
        
        // De-duplicate events by ID (in case of shared events on multiple calendars)
        const uniqueEvents = Array.from(new Map(allEvents.map(event => [event.id, event])).values());

        // Sort all collected events by start time
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

  // Fallback data for testing/demo when Auth fails
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
