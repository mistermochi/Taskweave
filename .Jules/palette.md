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

## 2026-05-16 - Enforcing Minimal Accessible Font Size
**Learning:** Font sizes below 12px (text-xs) significantly impair readability and fail WCAG accessibility standards for many users. While compact UI is desirable, functional labels and metadata must remain legible.
**Action:** Use `text-xs` (12px) as the absolute minimum font size for all functional UI elements, replacing any legacy `text-[10px]` or smaller definitions.
