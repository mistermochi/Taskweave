'use client';

import React from 'react';
import { SettingsView as SettingsViewNew } from '@/features/settings';

/**
 * User preferences and profile configuration view.
 * It provides a comprehensive interface for managing themes, external integrations
 * (like Google Calendar), hardware sensor permissions, and behavioral modeling.
 *
 * @component
 */
export const SettingsView: React.FC = () => {
  return (
    <div className="h-full w-full overflow-y-auto">
      <SettingsViewNew />
    </div>
  );
};

export default SettingsView;
