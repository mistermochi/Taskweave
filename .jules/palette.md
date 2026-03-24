## 2026-03-19 - Focus-Visible Sidebar Actions
**Learning:** Interactive elements in sidebars (like management buttons) should be visible on focus, not just hover, to ensure keyboard accessibility. Using `hidden` for buttons that need to be reachable via Tab prevents keyboard access entirely.
**Action:** Use `opacity-0` and `group-focus-within:opacity-100` instead of `hidden` for secondary actions. Use `absolute` positioning to overlap with non-interactive indicators (like counts) to prevent layout shifts when toggling visibility.

## 2026-03-20 - Semantic Metadata Visuals
**Learning:** Visual information scent (like energy levels and scheduled dates) must be consistent across different views (list, row, detail) to reduce cognitive load. High-energy tasks should use a warm color (Orange) consistently for both indicators and badges.
**Action:** Use `orange-500` for High energy, `yellow-500` for Medium, and `emerald-500` for Low. Use the `CalendarClock` icon specifically for scheduled/assigned dates to distinguish them from generic time or due dates.

## 2026-03-21 - Input Focus Visibility and Keyboard Flow
**Learning:** Custom inputs (like the Dashboard 'Main focus') and complex list buttons often lack standard browser focus rings. Explicitly adding `focus-visible:ring-2` ensures keyboard accessibility without cluttering the UI for mouse users. Additionally, single-line inputs feel more intuitive when 'Enter' triggers a blur (and subsequent save) rather than doing nothing.
**Action:** Always apply `focus-visible:ring-ring` and `focus-visible:ring-offset-2` to interactive custom elements. Use `onKeyDown` handlers on text inputs to call `e.target.blur()` when `e.key === "Enter"`.
