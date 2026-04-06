## 2026-03-19 - Focus-Visible Sidebar Actions
**Learning:** Interactive elements in sidebars (like management buttons) should be visible on focus, not just hover, to ensure keyboard accessibility. Using `hidden` for buttons that need to be reachable via Tab prevents keyboard access entirely.
**Action:** Use `opacity-0` and `group-focus-within:opacity-100` instead of `hidden` for secondary actions. Use `absolute` positioning to overlap with non-interactive indicators (like counts) to prevent layout shifts when toggling visibility.

## 2026-03-20 - Semantic Metadata Visuals
**Learning:** Visual information scent (like energy levels and scheduled dates) must be consistent across different views (list, row, detail) to reduce cognitive load. High-energy tasks should use a warm color (Orange) consistently for both indicators and badges.
**Action:** Use `orange-500` for High energy, `yellow-500` for Medium, and `emerald-500` for Low. Use the `CalendarClock` icon specifically for scheduled/assigned dates to distinguish them from generic time or due dates.

## 2026-03-31 - Accessible Tree Navigation
**Learning:** Hierarchical tree components (like `TagPicker`) must use semantic `button` elements and appropriate ARIA attributes (`aria-expanded`, `aria-pressed`) to be usable by screen readers and keyboard users. Sibling buttons for "expand" and "select" actions prevent invalid nesting while maintaining distinct interactive targets.
**Action:** Convert `div`-based tree nodes to sibling `button` elements. Use `focus-visible:ring-2` for clear keyboard indicators and `aria-label` for descriptive context beyond just the tag name. Ensure the `'use client';` directive is present for components using React hooks in the App Router.

## 2026-03-21 - Enhanced Dashboard Interactivity
**Learning:** Icon-only buttons or those with very brief labels (like Dashboard Quick Actions) benefit significantly from adding a `description` field that maps to both `aria-label` and `title`. This ensures screen reader clarity and hover discoverability without cluttering the visual UI. Pairing these actions with light haptic feedback (`vibrate('light')`) on mobile provides a more "native" and tactile feel.
**Action:** Always include a descriptive `title` and `aria-label` for dashboard action buttons. Implement `focus-visible:ring-2` to ensure keyboard focus is unmistakable, and use `vibrate('light')` for immediate tactile confirmation of the interaction.

## 2026-04-05 - Heatmap Data Density UX
**Learning:** Dense data visualizations (like heatmaps) require a careful balance of information scent and interaction design. Using opacity-based scaling of the primary color ensures the heatmap feels native to the brand while effectively communicating intensity (duration). Axis labels for every 5 days (X) and starting hours (Y) provide enough context without overwhelming the layout.
**Action:** Use fixed thresholds (<1h, 1-2h, 2-3h, 3-4h, 4h+) for heatmap color mapping to provide stable visual benchmarks. Wrap dense grid components in a single `TooltipProvider` to minimize provider nesting overhead. Implement mobile-specific truncations (e.g., 14 days instead of 30) to maintain legibility on narrow viewports.

## 2026-05-14 - Tactile Qualitative Selection
**Learning:** For high-intent qualitative selection (e.g., mood pickers, energy levels), incorporate mobile haptic feedback via `vibrate('light')`, semantic accessibility attributes (`type="button"`, `aria-pressed`), and tactile visual feedback using `active:scale-95` with `transition-all` for smooth response. This combination significantly improves the "feel" and usability of the interface, especially on touch devices.
**Action:** Always include haptics, `aria-pressed`, and subtle scale transitions for qualitative choice components.
