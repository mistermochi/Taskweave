## 2026-03-19 - Focus-Visible Sidebar Actions
**Learning:** Interactive elements in sidebars (like management buttons) should be visible on focus, not just hover, to ensure keyboard accessibility. Using `hidden` for buttons that need to be reachable via Tab prevents keyboard access entirely.
**Action:** Use `opacity-0` and `group-focus-within:opacity-100` instead of `hidden` for secondary actions. Use `absolute` positioning to overlap with non-interactive indicators (like counts) to prevent layout shifts when toggling visibility.

## 2026-03-20 - Semantic Metadata Visuals
**Learning:** Visual information scent (like energy levels and scheduled dates) must be consistent across different views (list, row, detail) to reduce cognitive load. High-energy tasks should use a warm color (Orange) consistently for both indicators and badges.
**Action:** Use `orange-500` for High energy, `yellow-500` for Medium, and `emerald-500` for Low. Use the `CalendarClock` icon specifically for scheduled/assigned dates to distinguish them from generic time or due dates.

## 2026-03-25 - Dashboard Interaction Polish
**Learning:** Single-line focus inputs on dashboards should support "Enter to blur" to provide an intuitive save-on-enter experience without needing a dedicated submit button. Visual progress indicators (like ReadinessRings) require explicit ARIA roles and labels to be accessible. Haptic feedback ('vibrate') adds a subtle confirmation layer for mobile users on save actions.
**Action:** Implement `onKeyDown` to call `blur()` on Enter for dashboard inputs. Ensure progress indicators have `role="progressbar"` and descriptive `aria-label`. Use the standardized `vibrate` utility for confirmation feedback.
