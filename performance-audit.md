# Performance Audit & Optimization Roadmap (Round 2)

## 1. Executive Summary

Following the successful implementation of our first performance refactor, this second-round audit focuses on the next layer of optimization: data flow efficiency and memory footprint reduction.

The key finding is that our global `TaskProvider` is overly broad. It fetches and provides active, completed, and archived tasks to the entire application, even though most components only need the active tasks. This "over-providing" of data causes unnecessary re-renders in major components whenever historical data changes, creating a performance bottleneck.

This plan outlines a strategy to slim down the global context and shift the responsibility of fetching historical data to the specific components that need it, leading to a faster, more memory-efficient application.

---

## 2. Key Findings & Analysis

### Finding 1: Over-Broad `TaskProvider` (High Severity)

-   **Observation:** The main `TaskContext` fetches and holds active, completed, and archived tasks. When a task is archived, its data is added to the context, which forces a recalculation in every component that consumes this context, including the `DashboardView` and `TaskDatabaseView`.
-   **Root Cause:** A single, global provider is trying to serve the data needs of all components simultaneously. This creates a tight coupling where a change in one domain (archiving) unnecessarily affects another (the dashboard's active plan).
-   **Impact:** This is the primary source of unnecessary computation in the application. The `useDashboardController` re-calculates the daily plan every time the archived list changes, which is inefficient.

### Finding 2: Inefficient Data Dependency in Controllers (Medium Severity)

-   **Observation:** Hooks like `useDashboardController` and `useTaskDatabaseController` depend on the `tasks` array from `useTaskContext`. Because this array changes whenever *any* task (active, completed, or archived) is updated, the expensive `useMemo` blocks inside these controllers run far too often.
-   **Root Cause:** The controllers are not able to specify that they *only* care about active tasks. They receive the entire collection and must filter it themselves, but the dependency is on the larger, unstable collection.
-   **Impact:** This leads to wasted CPU cycles, as the daily plan is re-sorted and re-calculated even when no active tasks have changed.

### Finding 3: Suboptimal Memory Footprint (Medium Severity)

-   **Observation:** The application holds up to 20 archived tasks and 20 completed tasks in global memory at all times.
-   **Root Cause:** The `TaskProvider` is designed to pre-fetch this data for convenience.
-   **Impact:** While not critical for most users, holding this historical data in memory increases the baseline resource consumption of the app. For users with many tasks, this can add up. A more efficient "on-demand" approach would be better.

---

## 3. The New Optimization Plan

This plan refactors our data-fetching strategy from a single global provider to a more decentralized, on-demand model.

### Epic 1: Slim Down `TaskProvider` to Active-Only

The goal is to make the global context lean and fast by having it manage only active tasks.

-   [x] **Action: Modify `TaskProvider`:** Refactor the `TaskProvider` to remove all logic related to fetching archived and completed tasks. Its sole responsibility will be to provide a real-time list of **active** tasks.

-   [x] **Action: Update `TaskDatabaseView` for On-Demand Fetching:** Modify the `TaskDatabaseView` to fetch its own `archived` and `completed` tasks when the user expands those sections. This localizes historical data to the only component that displays it, perfectly aligning data fetching with user intent.

### Epic 2: Stabilize Controller Logic

With a leaner provider, the controllers will become more stable by default.

-   [x] **Action: Refactor Controllers for Stability:** The `useDashboardController` and `useTaskDatabaseController` have been refactored. They now rely on the active-only `TaskProvider` and fetch their own historical data as needed. This removes redundant internal filtering and prevents unnecessary re-renders when historical data (like completed tasks) changes.

### Epic 3: Final Integration Polish

-   [x] **Action: Refactor `useDashboardController`:** Simplify the `useDashboardController` by removing its need to filter for active tasks, as it will now only receive active tasks from the context. This makes the code cleaner and more efficient.
