# Palette's Journal - Critical UX/Accessibility Learnings

This journal tracks critical UX and accessibility learnings for the taskweave project.

## 2026-05-15 - Improving Search Discoverability and Usability
**Learning:** Common keyboard shortcuts like '/' for focus and 'Esc' for clear are expected by power users and significantly improve efficiency. Providing a visual hint in the placeholder aids discoverability without cluttering the UI.
**Action:** Implement '/' to focus and 'Esc' to clear/blur search, and include the hint in the placeholder for desktop users.

## 2026-05-15 - Modernizing Date Selection UI
**Learning:** A two-column layout for date pickers (Quick Select + Calendar) provides a superior balance between speed and precision. Aligning this with other "flyover" components (like snooze) creates a more cohesive and predictable user experience.
**Action:** Re-implemented `DatePicker` with a shadcn-based two-column layout, utilizing `date-fns` for calculations and the shared `Calendar` component.

## 2026-05-15 - Ultra-Compact Responsive Pickers
**Learning:** For inline pickers, maintaining a side-by-side layout even on small viewports (by scaling down and using concise labels) preserves the hierarchy and efficiency of the "Quick Select + Precision" pattern better than stacking.
**Action:** Optimized `DatePicker` with reduced scaling (scale-90) and abbreviated labels (TMW, WKND) to fit side-by-side on mobile.

## 2026-04-23 - Enhancing Settings Tactile Feedback and Accessibility
**Learning:** Settings forms often lack the same level of tactile feedback and accessibility as primary task interactions. Applying consistent standards (aria-label, aria-pressed, vibrate, focus rings) to settings components ensures a high-quality experience across the entire application.
**Action:** Added accessibility attributes (aria-label, aria-pressed), tactile feedback (vibrate), and focus-visible/active styles to the accent color buttons and theme toggle in `AppearanceForm.tsx`.
