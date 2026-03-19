# Janitor's Journal

## 2025-05-15 - Removed Deprecated Navigation Components
**Clutter:** Orphaned components from a legacy architecture: `Sidebar.tsx`, `AppLayout.tsx`, `TagSidebar.tsx`, and `TagEditPicker.tsx`.
**Learning:** The project has migrated to a shadcn-based task list interface. Large chunks of code (approx. 600 lines) were leftover from the previous version. Build verification is crucial to ensure these files are truly unreferenced.
**Action:** Removed the deprecated files to reduce technical debt and codebase noise.

## 2025-05-22 - Renamed and Cleaned Up UI Components
**Clutter:** Deprecated `Toast` and unused `ErrorState` components in `Feedback.tsx`. Inconsistent file naming (`Feedback.tsx` vs. kebab-case elsewhere).
**Learning:** The project uses `sonner` for toasts. `EmptyState` was the only active component in `Feedback.tsx`.
**Action:** Removed dead code and renamed the file to `empty-state.tsx` to align with project conventions and improve discoverability.
