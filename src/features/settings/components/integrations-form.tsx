"use client";

import React from 'react';
import { useUserSettings } from "@/hooks/useUserSettings";
import { useCalendarImportController } from '@/hooks/controllers/useCalendarImportController';
import { useTaskContext } from '@/context/TaskContext';
import { GoogleCalendarService } from '@/services/GoogleCalendarService';
import { CalendarMappingRow } from '@/features/import-calendar/CalendarMappingRow';
import { useReferenceContext } from '@/context/ReferenceContext';
import { CalendarImportModal } from '@/features/import-calendar/CalendarImportModal';
import { Button } from "@/shared/ui/ui/button";
import { Calendar, Plus, Loader2 } from 'lucide-react';
import { toast } from "sonner";

export function IntegrationsForm() {
  const { settings, updateSettings } = useUserSettings();
  const { tasks } = useTaskContext();
  const { tags } = useReferenceContext();
  const { state: calendarState, actions: calendarActions } = useCalendarImportController(settings, tasks);

  const calendars = settings.googleCalendars || [];

  const handleConnectCalendar = async () => {
    const calendarService = GoogleCalendarService.getInstance();
    try {
      const token = await calendarService.getAccessToken();
      if (token) {
        const calendarList = await calendarService.fetchCalendarList(token);
        await updateSettings({ googleCalendars: calendarList, enabledCalendars: [] });
        toast.success("Connected to Google Calendar");
      }
    } catch (error) {
      console.error('Failed to connect to Google Calendar', error);
      toast.error("Failed to connect to Google Calendar");
    }
  };

  const handleConfirmImport = () => {
    calendarActions.confirmImport((count) => {
      if (count > 0) {
        toast.success(`Successfully imported ${count} task${count > 1 ? 's' : ''}.`);
      }
    });
  };

  const handleMappingChange = async (calendarId: string, projectId: string) => {
    const finalProjectId = projectId === "none" ? "" : projectId;
    const newMapping = {
      ...(settings.calendarProjectMapping || {}),
      [calendarId]: finalProjectId,
    };
    await updateSettings({ calendarProjectMapping: newMapping });
  };

  const handleEnabledCalendarsChange = async (calendarId: string) => {
    const currentEnabled = settings.enabledCalendars || [];
    const newEnabledCalendars = currentEnabled.includes(calendarId)
      ? currentEnabled.filter(id => id !== calendarId)
      : [...currentEnabled, calendarId];
    await updateSettings({ enabledCalendars: newEnabledCalendars });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Integrations</h3>
        <p className="text-sm text-muted-foreground">
          Connect external services to import tasks and sync your schedule.
        </p>
      </div>

      <div className="space-y-4">
        {/* Main Import Trigger */}
        <div className="flex flex-col gap-4 p-4 rounded-xl border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1 rounded-full border">
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" className="w-5 h-5" alt="Google Calendar" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Google Calendar</span>
                <span className="text-xs text-muted-foreground">Sync your events</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={calendarActions.startImport}
              disabled={calendarState.isLoading}
            >
              {calendarState.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Import Events
            </Button>
          </div>

          {calendarState.error && (
            <p className="text-xs text-destructive">{calendarState.error}</p>
          )}

          {/* Individual Calendar Configuration */}
          <div className="pt-2 border-t space-y-3">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Calendar to Project Mapping</label>
            <div className="space-y-2">
              {calendars.length === 0 ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={handleConnectCalendar}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Connect Account
                </Button>
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
      </div>

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
    </div>
  );
}
