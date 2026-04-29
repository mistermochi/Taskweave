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

## 2026-06-20 - Robust Empty State Accessibility
**Learning:** When using `role="region"` for a component like `EmptyState`, it is more robust and localization-friendly to use `aria-labelledby` pointing to the internal heading (using `useId`) rather than duplicating the title in an `aria-label`. Marking decorative icon containers with `aria-hidden="true"` ensures a cleaner screen reader experience.
**Action:** Use `useId` and `aria-labelledby` for labeled regions and hide decorative visuals.
