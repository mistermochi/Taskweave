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

## 2026-03-31 - Removed Unused Legacy Types and Redundant Navigation Prop
**Clutter:** Unused legacy interfaces (`ActivityLog`, `Habit`, `DailyPlan`, `ChatMessage`, `UserStats`, `ShiftType`, `NavigationHandler`) and the `NEW_TASK` enum member in `src/types.ts`. Redundant `onNavigate` prop in `InsightsView.tsx`.
**Learning:** As an application transitions from early prototypes to a more stable architecture, legacy types and placeholder navigation props often remain in core files. These "broken windows" increase cognitive load and can mislead developers about the current capabilities of the system. Surgical removal of these orphans, including cleaning up empty interfaces and unused imports, is essential for maintaining a high-signal codebase.
**Action:** Performed a sweep of `src/types.ts` and simplified component props in `InsightsView.tsx`, verifying structural integrity with a full production build.

## 2026-04-05 - Removed Redundant Service Alias and Fixed Unnecessary Memo Dependencies
**Clutter:** Redundant local alias `const taskService = taskApi` in `useDashboardController.ts`. Unnecessary task array dependencies in `useMemo` hooks within `TaskApp.tsx`.
**Learning:** Service singletons should be used directly in hooks to simplify dependency arrays and adhere to the project's "direct access" pattern. Including large raw data arrays in `useMemo` dependency lists when derived "source" variables are already present creates redundant reactivity and triggers ESLint `exhaustive-deps` warnings.
**Action:** Deleted the `taskService` alias and updated callers. Surgical removal of redundant `useMemo` dependencies to align with React best practices and eliminate lint warnings.

## 2026-04-07 - Removed Unused Lucide Icons and Redundant Logic
**Clutter:** Unused Lucide icon imports (`ChevronDown`, `X`) and an orphaned `toggleExpand` function in navigation components.
**Learning:** Components often accumulate "import drift" and orphaned helper functions during refactors (e.g., migrating from manual state toggling to Radix/shadcn primitives like `Collapsible`).
**Action:** Performed a surgical cleanup of `TaskTagTree.tsx` and `TaskDetailView.tsx` to remove dead code and reduce mental overhead.

## 2026-04-10 - Cleaned Up Unused State and Dependencies in useDashboardController
**Clutter:** Unused state variables `taskCount`, `hasMoodEntry`, and internal `completedCount` in `useDashboardController.ts`. Redundant local array allocation in `saveMood`.
**Learning:** Even well-optimized controllers can accumulate "shadow state" that is calculated but never consumed by the UI. High-frequency hooks like those in dashboards benefit from hoisting static configuration (like energy maps) to the module level to ensure reference stability and reduce allocation overhead.
**Action:** Removed unreferenced state properties and hoisted the mood energy map. Corrected hook dependency arrays to include stable O(1) lookup sets like `activeTaskIds`.

## 2026-04-12 - Identified Dual Navigation Systems and Orphaned ViewNames
**Clutter:** Parallel navigation systems (`NavigationContext` and `useTaskAppStore`) with overlapping responsibilities. Orphaned `ViewName` members (`CHAT`, `TASK_HISTORY`) with no corresponding UI implementation.
**Learning:** The application is transitioning between a custom `NavigationContext` (inherited from an earlier architecture) and a Zustand-based `useTaskAppStore` with a hash-router. Core UI rendering in `TaskApp.tsx` is driven by the Zustand store, leaving several `NavigationContext` transient views unreferenced and non-functional.
**Action:** Removed the orphaned `QuickFocusModal` and its associated state from the context. Further consolidation of these two systems is recommended to prevent state desynchronization and reduce cognitive overhead.

## 2026-04-15 - Consolidated Task List Components and Preserved Observability
**Clutter:** Redundant `TaskRow` component and its associated `TaskDetailsSheetContent`.
**Learning:** Consolidating UI components into a single "Source of Truth" (like `TaskListItem`) reduces structural entropy. However, Janitor sweeps must never remove `console.error` in catch blocks for fire-and-forget operations, as they are essential for production observability when no other logging service exists.
**Action:** Refactored `CalendarImportModal` to use `TaskListItem`, deleted the orphaned components, and explicitly preserved error logging.

## 2026-04-18 - Removed Unused Dexie Dependencies
**Clutter:** Unused `dexie` and `dexie-react-hooks` dependencies in `package.json` and `dep.toml`.
**Learning:** In addition to `package.json`, the project uses `dep.toml` for build-time external dependency management. Forgetting to sync both can lead to inconsistent build configurations.
**Action:** Removed orphaned dependencies from both configuration files and synchronized the lockfile.

## 2026-04-20 - Removed Unreferenced Task Metadata and Timer Hooks
**Clutter:** `useTaskTimer` and `useTaskDisplayInfo` in `src/entities/task/lib/useTaskTimer.ts`.
**Learning:** Core domain hooks (like those for task display info or timers) can become orphans after major UI refactors (e.g., removal of `TaskRow`). Always use global `grep` to verify if seemingly essential hooks are actually still in use before assuming they are protected.
**Action:** Deleted the unreferenced hook file and updated the entity index and documentation to reduce cognitive load and mental debt.
## 2026-04-29 - Removed Orphaned tagUtils Utility
**Clutter:** The orphaned utility file `src/shared/lib/tagUtils.ts` containing legacy recursive hierarchy helpers (`getChildTagIds`, `getTagDepth`, `getTagLineage`).
**Learning:** As the application's domain logic matures, early utility helpers often become redundant or superseded by domain-specific optimizations (like `processTagsForPicker` in the tag entity). Regular grep-based audits are essential to identify these unreferenced files and prevent structural entropy.
**Action:** Deleted the unreferenced utility file and verified structural integrity with a full production build.

## 2026-05-07 - Removed Orphaned NavigationParams Type
**Clutter:** The `NavigationParams` type in `src/types.ts` and its unused parameter in `NavigationContext.navigate`.
**Learning:** Even as navigation systems evolve (e.g., towards Zustand-based stores), legacy type definitions can remain in core files. However, Janitor sweeps must be careful not to remove enum members or state properties that represent dormant but functional feature paths (like `BREATHING` mode) which are still referenced by tests and specialized controllers.
**Action:** Removed the orphaned type and simplified the `navigate` function signature.

## 2026-05-20 - Removed Unused defaultLayout Prop
**Clutter:** The `defaultLayout` prop in `TaskApp.tsx` and its passing in `src/app/page.tsx`.
**Learning:** Leftover boilerplate props from template components (like resizable panels) can remain even after the underlying functionality is removed or changed. These "ghost props" increase cognitive load and make the component interface appear more complex than it actually is.
**Action:** Removed the unused prop and cleaned up the entry point, verifying that no logic depended on this value.

## 2026-05-09 - Consolidated Task Entity Types
**Clutter:** Redundant `TaskEntity` and `Task` type definitions and an unused `embedding` property.
**Learning:** Maintaining multiple names for the same core entity increases cognitive load. Consolidating to the most concise name (`Task`) improves codebase signal. Surgical updates are required to avoid breaking UI strings or introducing duplicate imports during global refactors.
**Action:** Renamed `TaskEntity` to `Task`, removed the redundant alias and unused property, and updated all references across 20 files.

## 2026-05-25 - Enforced Singleton Pattern Across Services
**Clutter:** Multiple services (, , , , , ) had public or implicit constructors despite being documented as singletons.
**Learning:** Documenting a class as a singleton is insufficient if the language permits direct instantiation via `new`. Enforcing `private` constructors is a critical structural constraint that prevents accidental state fragmentation and ensures a single "Source of Truth" for core application services.
**Action:** Enforced `private` constructors on all singleton services and verified that no external code was incorrectly instantiating them using a full build and lint sweep.

## 2026-05-25 - Enforced Singleton Pattern Across Services
**Clutter:** Multiple services (ContextApi, AIService, GoogleCalendarService, RecommendationEngine, DeviceService, LocationService) had public or implicit constructors despite being documented as singletons.
**Learning:** Documenting a class as a singleton is insufficient if the language permits direct instantiation via `new`. Enforcing `private` constructors is a critical structural constraint that prevents accidental state fragmentation and ensures a single "Source of Truth" for core application services.
**Action:** Enforced `private` constructors on all singleton services and verified that no external code was incorrectly instantiating them using a full build and lint sweep.

## 2026-05-28 - Streamlined SuggestionContext and Removed Redundant Async Logic
**Clutter:** Redundant properties `availableMinutes`, `backlogCount`, and `userContext` in `SuggestionContext` interface.
**Learning:** Derived state (like `backlogCount`) should be calculated by consumers from raw data (`tasks.length`) to prevent desynchronization. Removing unused asynchronous calls (like `contextApi.getSnapshot()`) that populate these redundant properties reduces latency and cognitive load.
**Action:** Pruned the `SuggestionContext` interface and updated all call sites in the recommendation engine and dashboard controller.

## 2026-06-01 - Removed Redundant defaultCollapsed Prop Chain
**Clutter:** The `defaultCollapsed` prop in `TaskApp.tsx` and its hardcoded passing in `src/app/page.tsx`.
**Learning:** Leftover boilerplate props from template components can remain even after the underlying functionality is moved to a global store. These "ghost props" increase cognitive load and make the component interface appear more complex than it actually is.
**Action:** Removed the unused prop and the `useEffect` that synchronized it to the store, simplifying the component interface and reducing property drilling.

## 2026-06-14 - Preserved Functional Persistence and Robustness
**Clutter:** Redundant intermediate variables in TaskApp.tsx filtering logic.
**Learning:** Janitor sweeps must prioritize functional safety over mere code reduction. Persistence mechanisms (like cookies for UI state) and 'robustness' fallbacks in filtering logic should be preserved even if they appear technically unreachable or the associated library seems absent, as they may be critical for UI stability and error handling.
**Action:** Streamlined variable structure while explicitly restoring functional cookie logic and robustness checks following code review feedback.

## 2026-06-30 - Removed Redundant EnvironmentContext
**Clutter:** The redundant `EnvironmentContext` (`src/context/EnvironmentContext.tsx`) and its provider in `DataProviders.tsx`.
**Learning:** React Context should not be used as a proxy for globally available build-time constants like `process.env.NODE_ENV`. Accessing these variables directly reduces component tree depth, simplifies the provider architecture, and eliminates unnecessary re-renders or indirection.
**Action:** Deleted the context file, removed the provider from the global tree, and updated architectural documentation to reflect the streamlined structure.
