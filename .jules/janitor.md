# Janitor's Journal

## 2025-05-15 - Removed Deprecated Navigation Components
**Clutter:** Orphaned components from a legacy architecture: `Sidebar.tsx`, `AppLayout.tsx`, `TagSidebar.tsx`, and `TagEditPicker.tsx`.
**Learning:** The project has migrated to a shadcn-based task list interface. Large chunks of code (approx. 600 lines) were leftover from the previous version. Build verification is crucial to ensure these files are truly unreferenced.
**Action:** Removed the deprecated files to reduce technical debt and codebase noise.
