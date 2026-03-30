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

## 2026-03-28 - Removed Orphaned Scheduling and Learning Engines
**Clutter:** Legacy services `LearningEngine.ts` and `LocalSchedulingEngine.ts` and their associated types.
**Learning:** As a project evolves, early heuristic-based engines can be superseded by more advanced architectures (like `RecommendationEngine`). Maintaining these orphaned files increases cognitive load and can lead to confusion about the system's "source of truth" for logic.
**Action:** Deleted the deprecated service files and cleaned up the `SuggestionContext` type to remove unused properties, ensuring the codebase reflects the current architectural state.

## 2026-03-30 - Removed Orphaned AI Placeholders and Redundant Service Aliases
**Clutter:** Orphaned AI scheduling methods (`generateSuggestions`, `getUsageStats`, `resetUsageStats`) and their associated types (`AIPredictionRequest`, `AIPredictionResponse`). Redundant `taskService` alias in `useFocusSessionController.ts`.
**Learning:** Placeholder methods and unused types increase structural entropy and cognitive load. Direct use of service singletons in hooks is preferred over local aliasing to simplify dependency management and satisfy ESLint rules.
**Action:** Deleted orphaned methods and types. Refactored `useFocusSessionController.ts` to use `taskApi` directly, resolving linting warnings and improving readability.

## 2026-04-01 - Removed Unused Imports and Shadowed Constant in TaskDetailView
**Clutter:** Multiple unused imports (`date-fns`, Radix UI, Lucide) and a shadowed `today` constant in `TaskDetailView.tsx`, plus a leftover `console.log` in `TagPickerLogic.test.ts`.
**Learning:** Components undergoing rapid iteration often accumulate "import drift" where utilities and icons are added but not removed when logic or UI structure changes. Shadowed variables (like `today`) can lead to subtle logic confusion and increase cognitive load during maintenance.
**Action:** Regularly run `pnpm lint` and perform surgical cleanups of unused symbols and shadowed variables to maintain component readability and prevent structural entropy.

## 2026-04-03 - Removed Unused Accordion Component and Dependency
**Clutter:** The `Accordion` UI component (`src/shared/ui/ui/accordion.tsx`) and its corresponding Radix dependency were unreferenced.
**Learning:** Even standard UI components can become "dead" if the application's design evolves towards other patterns (like tabs or lists). Regular audits of the `src/shared/ui/ui` directory against the rest of the `src` folder help identify these orphaned components.
**Action:** Deleted the component file and removed `@radix-ui/react-accordion` from `package.json` and lockfiles.

## 2026-04-05 - Removed Orphaned Types and Redundant Props
**Clutter:** Unused legacy interfaces (`ActivityLog`, `Habit`, `DailyPlan`, `ChatMessage`, `UserStats`, `ShiftType`, `NavigationHandler`) and the `NEW_TASK` enum member in `src/types.ts`. Redundant `onNavigate` prop in `InsightsView.tsx`.
**Learning:** Rapid architectural shifts often leave behind "ghost types" from abandoned features (like the early scheduling or chat experiments). Regular grep-based audits are necessary because standard linters often miss unused TypeScript interfaces if they are exported.
**Action:** Deleted the orphaned types/interfaces and removed the redundant prop from the Insights component and its call sites.
