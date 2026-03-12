# Palette's Journal - Critical UX/Accessibility Learnings

This journal tracks critical UX and accessibility learnings for the taskweave project.

## 2026-05-15 - Improving Search Discoverability and Usability
**Learning:** Common keyboard shortcuts like '/' for focus and 'Esc' for clear are expected by power users and significantly improve efficiency. Providing a visual hint in the placeholder aids discoverability without cluttering the UI.
**Action:** Implement '/' to focus and 'Esc' to clear/blur search, and include the hint in the placeholder for desktop users.

## 2026-05-15 - Modernizing Date Selection UI
**Learning:** A two-column layout for date pickers (Quick Select + Calendar) provides a superior balance between speed and precision. Aligning this with other "flyover" components (like snooze) creates a more cohesive and predictable user experience.
**Action:** Re-implemented `DatePicker` with a shadcn-based two-column layout, utilizing `date-fns` for calculations and the shared `Calendar` component.
