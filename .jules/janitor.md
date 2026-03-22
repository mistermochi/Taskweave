# Janitor's Journal

## 2025-05-15 - Removed Deprecated Navigation Components
**Clutter:** Orphaned components from a legacy architecture: `Sidebar.tsx`, `AppLayout.tsx`, `TagSidebar.tsx`, and `TagEditPicker.tsx`.
**Learning:** The project has migrated to a shadcn-based task list interface. Large chunks of code (approx. 600 lines) were leftover from the previous version. Build verification is crucial to ensure these files are truly unreferenced.
**Action:** Removed the deprecated files to reduce technical debt and codebase noise.

## 2025-05-22 - Renamed and Cleaned Up UI Components
**Clutter:** Deprecated `Toast` and unused `ErrorState` components in `Feedback.tsx`. Inconsistent file naming (`Feedback.tsx` vs. kebab-case elsewhere).
**Learning:** The project uses `sonner` for toasts. `EmptyState` was the only active component in `Feedback.tsx`.
**Action:** Removed dead code and renamed the file to `empty-state.tsx` to align with project conventions and improve discoverability.

## 2026-03-20 - Removed Unused useContextApi Hook
**Clutter:** The `useContextApi` hook in `src/entities/context/lib/useContextApi.ts` was a redundant wrapper around a singleton that provided no reactivity.
**Learning:** boilerplate hooks that use `useSyncExternalStore` with a no-op subscription (emptySubscribe) add mental overhead without functional benefits. Direct singleton access is preferred when no React-lifecycle-dependent state sync is needed.
**Action:** Deleted the hook file and removed its export from the entity index.

## 2026-03-24 - Removed Obsolete Radix Toast Component and Dependency
**Clutter:** Obsolete Radix-based toast implementation (`src/shared/ui/ui/toast.tsx`) and the `@radix-ui/react-toast` dependency.
**Learning:** The application has completely migrated to `sonner` for toast notifications. Maintaining unused UI components from previous implementations increases bundle size and potential confusion for developers.
**Action:** Deleted the unreferenced `toast.tsx` file and removed the `@radix-ui/react-toast` dependency.
