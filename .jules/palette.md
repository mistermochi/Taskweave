## 2026-03-19 - Focus-Visible Sidebar Actions
**Learning:** Interactive elements in sidebars (like management buttons) should be visible on focus, not just hover, to ensure keyboard accessibility. Using `hidden` for buttons that need to be reachable via Tab prevents keyboard access entirely.
**Action:** Use `opacity-0` and `group-focus-within:opacity-100` instead of `hidden` for secondary actions. Use `absolute` positioning to overlap with non-interactive indicators (like counts) to prevent layout shifts when toggling visibility.

## 2026-03-20 - Semantic Metadata Visuals
**Learning:** Visual information scent (like energy levels and scheduled dates) must be consistent across different views (list, row, detail) to reduce cognitive load. High-energy tasks should use a warm color (Orange) consistently for both indicators and badges.
**Action:** Use `orange-500` for High energy, `yellow-500` for Medium, and `emerald-500` for Low. Use the `CalendarClock` icon specifically for scheduled/assigned dates to distinguish them from generic time or due dates.

## 2026-03-21 - Enhanced Dashboard Interactivity
**Learning:** Icon-only buttons or those with very brief labels (like Dashboard Quick Actions) benefit significantly from adding a `description` field that maps to both `aria-label` and `title`. This ensures screen reader clarity and hover discoverability without cluttering the visual UI. Pairing these actions with light haptic feedback (`vibrate('light')`) on mobile provides a more "native" and tactile feel.
**Action:** Always include a descriptive `title` and `aria-label` for dashboard action buttons. Implement `focus-visible:ring-2` to ensure keyboard focus is unmistakable, and use `vibrate('light')` for immediate tactile confirmation of the interaction.
