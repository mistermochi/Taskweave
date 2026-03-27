## 2026-03-19 - Focus-Visible Sidebar Actions
**Learning:** Interactive elements in sidebars (like management buttons) should be visible on focus, not just hover, to ensure keyboard accessibility. Using `hidden` for buttons that need to be reachable via Tab prevents keyboard access entirely.
**Action:** Use `opacity-0` and `group-focus-within:opacity-100` instead of `hidden` for secondary actions. Use `absolute` positioning to overlap with non-interactive indicators (like counts) to prevent layout shifts when toggling visibility.

## 2026-03-20 - Semantic Metadata Visuals
**Learning:** Visual information scent (like energy levels and scheduled dates) must be consistent across different views (list, row, detail) to reduce cognitive load. High-energy tasks should use a warm color (Orange) consistently for both indicators and badges.
**Action:** Use `orange-500` for High energy, `yellow-500` for Medium, and `emerald-500` for Low. Use the `CalendarClock` icon specifically for scheduled/assigned dates to distinguish them from generic time or due dates.

## 2026-03-27 - Accessible Task List Metadata
**Learning:** Task list items acting as primary navigation/selection buttons must have explicit focus rings and comprehensive ARIA labels. Visual metadata (like project tags and energy levels) must be reflected in the `aria-label` to provide immediate context for screen reader users without them having to navigate into the item's children.
**Action:** Always include key metadata (Project, Energy, Status) in the `aria-label` of task list buttons. Use `focus-visible:ring-offset-2` to ensure the focus indicator is clearly visible against the list item's border.
