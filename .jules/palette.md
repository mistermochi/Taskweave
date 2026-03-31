## 2026-03-19 - Focus-Visible Sidebar Actions
**Learning:** Interactive elements in sidebars (like management buttons) should be visible on focus, not just hover, to ensure keyboard accessibility. Using `hidden` for buttons that need to be reachable via Tab prevents keyboard access entirely.
**Action:** Use `opacity-0` and `group-focus-within:opacity-100` instead of `hidden` for secondary actions. Use `absolute` positioning to overlap with non-interactive indicators (like counts) to prevent layout shifts when toggling visibility.

## 2026-03-20 - Semantic Metadata Visuals
**Learning:** Visual information scent (like energy levels and scheduled dates) must be consistent across different views (list, row, detail) to reduce cognitive load. High-energy tasks should use a warm color (Orange) consistently for both indicators and badges.
**Action:** Use `orange-500` for High energy, `yellow-500` for Medium, and `emerald-500` for Low. Use the `CalendarClock` icon specifically for scheduled/assigned dates to distinguish them from generic time or due dates.

## 2026-03-31 - Accessible Tree Navigation
**Learning:** Hierarchical tree components (like `TagPicker`) must use semantic `button` elements and appropriate ARIA attributes (`aria-expanded`, `aria-pressed`) to be usable by screen readers and keyboard users. Sibling buttons for "expand" and "select" actions prevent invalid nesting while maintaining distinct interactive targets.
**Action:** Convert `div`-based tree nodes to sibling `button` elements. Use `focus-visible:ring-2` for clear keyboard indicators and `aria-label` for descriptive context beyond just the tag name. Ensure the `'use client';` directive is present for components using React hooks in the App Router.
