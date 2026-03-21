## 2026-03-19 - Focus-Visible Sidebar Actions
**Learning:** Interactive elements in sidebars (like management buttons) should be visible on focus, not just hover, to ensure keyboard accessibility. Using `hidden` for buttons that need to be reachable via Tab prevents keyboard access entirely.
**Action:** Use `opacity-0` and `group-focus-within:opacity-100` instead of `hidden` for secondary actions. Use `absolute` positioning to overlap with non-interactive indicators (like counts) to prevent layout shifts when toggling visibility.

## 2026-03-21 - Semantic Color Coding for Task Metadata
**Learning:** Monochromatic metadata (e.g., all blue badges) reduces "information scent" and forces users to read text to understand task intensity. Semantic color-coding (Orange for High, Yellow for Medium, Emerald for Low) allows for instant pre-attentive processing of task lists.
**Action:** Use consistent semantic colors across all views (List, Detail, Dashboard) for qualitative metadata like Energy or Priority. Ensure icons for similar data types (e.g., Scheduled Date vs. Due Date) are distinct to avoid confusion.
