'use client';

import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/Card';
import { Calendar, Plus, Loader2 } from 'lucide-react';
import { useCalendarImportController } from '@/hooks/controllers/useCalendarImportController';
import { UserSettings, TaskEntity } from '@/types';
import { GoogleCalendarService } from '@/services/GoogleCalendarService';
import { CalendarMappingRow } from '@/components/CalendarMappingRow';
import { useReferenceContext } from '@/context/ReferenceContext';
import { CalendarImportModal } from '@/components/CalendarImportModal';

/**
 * Interface for IntegrationsSettings props.
 */
interface IntegrationsSettingsProps {
  /** The current user settings object. */
  settings: Partial<UserSettings>;
  /** Callback to update settings in Firestore. */
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  /** Callback to display a notification to the user. */
  showToast: (message: string) => void;
  /** List of all tasks (to check for duplicates during import). */
  tasks: TaskEntity[];
}

/**
 * Settings section for managing third-party integrations (e.g., Google Calendar).
 * Handles the OAuth connection flow and the configuration of calendar-to-project mappings.
 *
 * @component
 * @interaction
 * - Triggers `GoogleCalendarService` to obtain access tokens.
 * - Manages the visibility of the `CalendarImportModal`.
 * - Allows users to toggle which specific calendars are active for synchronization.
 */
export const IntegrationsSettings: React.FC<IntegrationsSettingsProps> = ({ settings, updateSettings, showToast, tasks }) => {
  const { state: calendarState, actions: calendarActions } = useCalendarImportController(settings, tasks);
  const { tags } = useReferenceContext();
  const calendars = settings.googleCalendars || [];

  /**
   * Initiates the connection to Google and fetches the list of available calendars.
   */
  const handleConnectCalendar = async () => {
    const calendarService = GoogleCalendarService.getInstance();
    try {
      const token = await calendarService.getAccessToken();
      if (token) {
        const calendarList = await calendarService.fetchCalendarList(token);
        updateSettings({ googleCalendars: calendarList, enabledCalendars: [] });
      }
    } catch (error) {
      console.error('Failed to connect to Google Calendar', error);
    }
  };

  const handleConfirmImport = () => {
    calendarActions.confirmImport((count) => {
      if (count > 0) {
        showToast(`Successfully imported ${count} task${count > 1 ? 's' : ''}.`);
      }
    });
  };

  const handleMappingChange = (calendarId: string, projectId: string) => {
    const newMapping = {
      ...(settings.calendarProjectMapping || {}),
      [calendarId]: projectId,
    };
    updateSettings({ calendarProjectMapping: newMapping });
  };

  const handleEnabledCalendarsChange = (calendarId: string) => {
    const currentEnabled = settings.enabledCalendars || [];
    const newEnabledCalendars = currentEnabled.includes(calendarId)
      ? currentEnabled.filter(id => id !== calendarId)
      : [...currentEnabled, calendarId];
    updateSettings({ enabledCalendars: newEnabledCalendars });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
            <Calendar size={18} />
          </div>
          <div>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>Connect external services.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className='pt-0'>
          <div className="space-y-2">
            {/* Main Import Trigger */}
            <button
              onClick={calendarActions.startImport}
              disabled={calendarState.isLoading}
              className="w-full flex items-center justify-between p-3 bg-surface-highlight rounded-xl border border-border hover:border-foreground/20 hover:bg-surface-highlight transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white p-1 rounded-full">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" className="w-5 h-5" alt="Google Calendar" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground">Google Calendar</span>
                  <span className="text-xxs text-secondary group-hover:text-primary transition-colors">
                    {calendarState.isLoading ? "Connecting..." : "Import Events"}
                  </span>
                </div>
              </div>
              {calendarState.isLoading ? <Loader2 size={16} className="animate-spin text-secondary" /> : <Plus size={16} className="text-secondary group-hover:text-foreground" />}
            </button>

            {calendarState.error && (
              <div className="text-xxs text-red-400 px-1">
                {calendarState.error}
              </div>
            )}

            {/* Individual Calendar Configuration */}
            <div className="pt-2">
              <label className="text-xs text-secondary/80 font-bold uppercase tracking-wider">Calendar to Project Mapping</label>
              <div className="space-y-2 pt-2">
                {calendars.length === 0 ? (
                  <button
                    onClick={handleConnectCalendar}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 font-bold text-xs rounded-lg border border-blue-500/20 transition-colors"
                  >
                    <Calendar size={14} /> Connect to Google Calendar
                  </button>
                ) : calendars.map(calendar => (
                    <CalendarMappingRow
                        key={calendar.id}
                        calendar={calendar}
                        projects={tags}
                        selectedProject={settings.calendarProjectMapping?.[calendar.id] || ''}
                        onMappingChange={handleMappingChange}
                        isEnabled={settings.enabledCalendars?.includes(calendar.id) || false}
                        onToggleEnabled={handleEnabledCalendarsChange}
                    />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <CalendarImportModal 
        isOpen={calendarState.isOpen}
        events={calendarState.events}
        selectedIds={calendarState.selectedIds}
        importedEventIds={calendarState.importedEventIds}
        onToggle={calendarActions.toggleSelection}
        onConfirm={handleConfirmImport}
        onCancel={calendarActions.cancelImport}
        tags={tags}
        settings={settings}
      />
    </>
  );
};
