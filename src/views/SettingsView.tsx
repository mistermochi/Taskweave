'use client';

import React, { useState } from 'react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Page } from '@/shared/layout/Page';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { IntegrationsSettings } from '@/components/settings/IntegrationsSettings';
import { ContextSensorsSettings } from '@/components/settings/ContextSensorsSettings';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { MentalModelSettings } from '@/components/settings/MentalModelSettings';
import { TypicalScheduleSettings } from '@/components/settings/TypicalScheduleSettings';
import { Actions } from '@/components/settings/Actions';
import { Toast } from '@/shared/ui/Feedback';
import { useTaskContext } from '@/context/TaskContext';

/**
 * User preferences and profile configuration view.
 * It provides a comprehensive interface for managing themes, external integrations
 * (like Google Calendar), hardware sensor permissions, and behavioral modeling.
 *
 * @component
 */
export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useUserSettings();
  const { tasks } = useTaskContext();
  const seed = settings.displayName || 'taskweave';
  const [toast, setToast] = useState({ visible: false, message: "" });

  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => {
        setToast({ visible: false, message: "" });
    }, 5000);
  };

  return (
    <Page.Root>
      <Page.Header
        title="Settings & Profile"
        subtitle="PERSONALIZATION"
        actions={
          <div className="h-8 w-8 rounded-full border border-border bg-foreground/5 flex items-center justify-center">
            <img src={settings.photoURL || `https://picsum.photos/seed/${seed}/100`} className="h-full w-full object-cover rounded-full opacity-80" />
          </div>
        }
      />

      <Page.Content>
        <div className="md:grid md:grid-cols-2 md:gap-8 max-w-4xl mx-auto">
          {/* Left Column: Technical Settings */}
          <div>
            <Page.Section>
              <AppearanceSettings settings={settings} updateSettings={updateSettings} />
            </Page.Section>

            <Page.Section>
              <IntegrationsSettings settings={settings} updateSettings={updateSettings} showToast={showToast} tasks={tasks} />
            </Page.Section>

            <Page.Section>
              <ContextSensorsSettings settings={settings} updateSettings={updateSettings} />
            </Page.Section>
          </div>

          {/* Right Column: Profile & Mental Model */}
          <div>
            <Page.Section>
              <ProfileSettings settings={settings} />
            </Page.Section>

            <Page.Section>
              <MentalModelSettings />
            </Page.Section>

            <Page.Section>
              <label className="mb-4 block text-xs font-bold uppercase tracking-wider text-secondary">Typical Schedule</label>
              <TypicalScheduleSettings settings={settings} updateSettings={updateSettings} />
            </Page.Section>
          </div>
        </div>

        <Page.Section className="max-w-4xl mx-auto mt-8">
          <Actions />
        </Page.Section>
      </Page.Content>
      <Toast 
          message={toast.message} 
          isVisible={toast.visible}
      />
    </Page.Root>
  );
};

export default SettingsView;
