import React from 'react';
import { Card, CardContent } from '@/shared/ui/ui/card';
import { auth } from '@/shared/api/firebase';
import { UserSettings } from '@/hooks/useUserSettings';

/**
 * Interface for ProfileSettings props.
 */
interface ProfileSettingsProps {
  /** The current user settings (contains display name and photo). */
  settings: Partial<UserSettings>;
}

/**
 * Presentational component for the user's profile summary.
 * Displays the user's avatar, name, and authenticated email address.
 *
 * @component
 */
export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ settings }) => {
  const seed = settings.displayName || 'taskweave';

  return (
    <Card>
      <CardContent className="flex items-center gap-4 relative z-10">
        {/* User Avatar */}
        <div className="h-14 w-14 rounded-full border border-border overflow-hidden shrink-0">
          <img
            src={settings.photoURL || `https://picsum.photos/seed/${seed}/100`}
            className="h-full w-full object-cover"
            alt="User profile"
          />
        </div>
        {/* Profile Info */}
        <div className="flex-1">
          <div className="text-lg font-medium text-foreground">{settings.displayName}</div>
          <div className="text-xs text-secondary">{auth.currentUser?.email}</div>
        </div>
      </CardContent>
    </Card>
  );
};
