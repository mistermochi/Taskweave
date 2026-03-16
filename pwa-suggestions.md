# PWA Feature Suggestions for Taskweave

To further enhance the mobile experience and make Taskweave feel like a truly native application, here are several PWA features that can be leveraged:

## 1. App Badging API
*   **Goal:** Increase engagement and provide at-a-glance information.
*   **Implementation:** Use `navigator.setAppBadge(count)` to display the number of active or overdue tasks on the application icon.
*   **Benefit:** Users can see if they have pending work without even opening the app.

## 2. Web Share Target
*   **Goal:** Streamline task creation from other apps.
*   **Implementation:** Configure the `share_target` in `manifest.json`. This allows Taskweave to appear in the system's native share sheet.
*   **Benefit:** A user reading an article in their browser can "Share" it directly to Taskweave to automatically create a task with the link.

## 3. Screen Wake Lock API
*   **Goal:** Prevent interruptions during focused work.
*   **Implementation:** Request a wake lock when a Focus Session is active (`navigator.wakeLock.request('screen')`).
*   **Benefit:** The screen won't dim or turn off while the user is in the middle of a focus session, keeping the timer and current task visible.

## 4. Push Notifications & Notification Triggers
*   **Goal:** Provide timely reminders and encourage planning.
*   **Implementation:** Use the Push API for server-sent reminders or Notification Triggers for scheduled local notifications (e.g., reminding the user to plan their day at 8 AM).
*   **Benefit:** Re-engages users and helps them stay on top of their schedule without needing to have the app open.

## 5. Periodic Background Sync
*   **Goal:** Ensure data is always fresh.
*   **Implementation:** Register a periodic sync task to fetch the latest calendar events or sync analytics in the background.
*   **Benefit:** When the user opens the app, their dashboard is already up-to-date, reducing perceived loading times.

## 6. Haptic Feedback (Vibration API)
*   **Goal:** Enhance the tactile feel of the UI.
*   **Implementation:** Trigger short vibrations (`navigator.vibrate()`) when a task is completed, when a focus timer ends, or when interacting with the "Zap" (Focus Now) button.
*   **Benefit:** Provides physical confirmation of actions, which is common in high-quality native mobile apps.

## 7. Media Session API (Implemented)
*   **Goal:** Control focus sessions from the lock screen.
*   **Implementation:** Use the Media Session API to show "playing" status during a focus session.
*   **Benefit:** Users can see the current task title and potentially pause/resume the focus timer directly from their phone's lock screen or notification shade.
