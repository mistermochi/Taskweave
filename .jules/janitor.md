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

## 2026-03-25 - Resolved Redundant Context Provider Nesting
**Clutter:** `AppProvider` was wrapping the application in both `src/app/layout.tsx` and `src/app/page.tsx`.
**Learning:** Redundant context provider nesting in Next.js App Router can cause double-initialization of global data listeners (Firestore) and side effects. Global providers should be consolidated in the root layout to ensure a single state tree and consistent side-effect execution.
**Action:** Removed the nested provider from `page.tsx` and verified structural integrity with a production build.

## 2026-03-27 - Standardized UI Component Naming
**Clutter:** `SectionHeader.tsx` was using PascalCase, deviating from the kebab-case convention used for all other shared UI components.
**Learning:** Shared UI components in `src/shared/ui/ui/` follow a strict kebab-case naming convention. Inconsistent naming can lead to import errors in case-sensitive environments and increases mental overhead for developers.
**Action:** Renamed `SectionHeader.tsx` to `section-header.tsx` and updated its primary usage in `dashboard-view.tsx`.
