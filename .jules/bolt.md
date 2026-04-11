## 2025-05-22 - [Performance Optimization in Task App]
**Learning:** Hoisting loop-invariant lookups like `tags.find` from filtering logic and using `useMemo` for O(1) map lookups in list rendering measurably improves UI responsiveness. Additionally, fine-grained Zustand selectors are crucial for preventing expensive re-renders in complex component trees.
**Action:** Always check for repeated array scans inside `useMemo` or `render` loops and replace with hoisted variables or map-based lookups. Use selective Zustand subscriptions to isolate component updates.

## 2025-05-23 - [Redundant Firestore Subscriptions]
**Learning:** Top-level components often accidentally duplicate Firestore subscriptions that are already managed by global context providers. This creates redundant snapshot listeners, duplicate reconciliation work, and increased memory usage.
**Action:** Before calling `useFirestoreCollection` in a view, check if a global context (like `TaskContext` or `ReferenceContext`) already provides that data. Consolidate to a single source of truth to reduce CPU and network overhead.

## 2025-05-24 - [Lookup Map Collisions & Filter Reordering]
**Learning:** Mixing IDs and human-readable names in a single lookup map (e.g., `mergedTagsMap`) for "O(1) convenience" introduces a risk of collisions. In high-volume list filtering, reordering the filter callback to perform fast, highly-selective status checks before expensive string parsing or search matching significantly reduces CPU overhead.
**Action:** Use separate specialized maps for different key types (IDs vs names). Always place the most selective and computationally cheapest filters at the top of iteration logic.

## 2025-05-25 - [Hot-Path Date Logic & Redundant Sorting]
**Learning:** Performing `new Date()` or complex `date-fns` calls (like `isToday`) inside large iteration loops is a common source of CPU overhead and GC pressure. Pre-calculating DST-safe boundaries once outside the loop allows for fast numeric timestamp comparisons. Additionally, blindly sorting filtered arrays is often redundant if the source context already provides sorted data via database constraints.
**Action:** Always pre-calculate date boundaries outside loops. Check upstream data providers for existing sort order before applying manual `.sort()`.

## 2025-05-26 - [Single-Pass Data Aggregation]
**Learning:** Chaining multiple higher-order functions (`filter`, `map`, `reduce`) over large arrays leads to redundant iterations and increased CPU overhead. Consolidating these operations into a single $O(N)$ pass significantly improves performance as the dataset grows.
**Action:** When calculating multiple metrics from the same array, prioritize a single-pass aggregation loop over multiple specialized iterations.

## 2025-05-27 - [Algorithmic Optimization of Recommendation Engine]
**Learning:** Using $O(N \log N)$ sorting and repeated $O(N)$ filtering in hot loops (like history recalibration) leads to $O(N^2)$ complexity, which degrades rapidly for users with large histories. Replacing these with $O(N)$ linear scans and sliding pointers reduces complexity to $O(N \log N)$ or $O(N)$, significantly improving processing speed.
**Action:** Always prefer single-pass linear searches (`reduce`) or sliding pointers over sorting when identifying a single "best" element or processing chronological event streams. Use array slicing or index tracking instead of repeated filtering within loops.

## 2025-05-28 - [Reconciliation Optimization & Consolidated Mapping]
**Learning:** Performing array searches (`findIndex`, `find`) inside loops when merging optimistic UI state with server data creates an $O(N \cdot M)$ bottleneck. Converting the source array to a `Map` allows for $O(N + M)$ reconciliation. Additionally, multiple `useMemo` hooks that iterate over the same array can be consolidated into a single $O(T)$ pass.
**Action:** Use `Map`-based reconciliation for merging state and consolidate multiple lookup map iterations into a single pass.

## 2025-05-29 - [Fine-Grained Memoization & Filter Hoisting]
**Learning:** Passing large global lookup maps to memoized list items breaks memoization whenever any unrelated entry in the map changes. Passing only the specific required object allows `React.memo` to work effectively. Additionally, hoisting status-based partitioning to the parent component avoids redundant $O(N)$ scans in multiple child navigation components.
**Action:** Always pass specific objects rather than entire lookup maps to memoized components. Hoist and share pre-filtered arrays to reduce redundant collection traversals in nested component trees.

## 2026-03-26 - [Hierarchical Tag Rendering Optimization]
**Learning:** $O(T^2)$ complexity in hierarchical tree rendering can be reduced to $O(T)$ by pre-calculating lookup maps (ID-to-Tag, Parent-to-Children) and a visibility set for search results. Consolidating this logic into a shared utility enables both efficient rendering and robust benchmark testing.
**Action:** When rendering deep hierarchies, always use $O(1)$ map-based lookups for parent/child relationships. Extract core data processing logic into utilities to facilitate unit and performance testing.

## 2025-05-30 - [Consolidated Reconciliation and O(1) Task Resolution]
**Learning:** Consolidating multiple O(N) passes into a single iteration within `useMemo` reduces CPU overhead during data reconciliation. Replacing O(N) array searches with O(1) Map lookups prevents UI jank. A critical edge case discovered was the need for a Map size guard in effects to prevent premature state clearing before initial data has populated.
**Action:** Consolidate data reconciliation passes and always provide a lookup map to hooks/components needing frequent by-ID access. Use Map size or array length guards in effects to distinguish between "empty" and "loading" states.

## 2026-03-27 - [Status-Based Subset Filtering]
**Learning:** In applications with large historical datasets, filtering the entire collection for every UI interaction is a major source of UI jank. Pre-partitioning tasks by status during the initial merge pass allows the UI to operate on $O(N_{subset})$. Robustness is key: include a fallback to the full collection and original filtering logic for unrecognized states.
**Action:** Always pre-partition large collections by primary status filters during data reconciliation. Implement "fast-path" filtering on subsets while maintaining a robust fallback for unrecognized states.

## 2026-03-31 - [LinUCB Matrix Inversion Caching]
**Learning:** The LinUCB recommendation engine performs O(d³) matrix inversions for each available strategy arm on every prediction call. Caching the inverse matrix (A⁻¹) and only recomputing it when the model parameters (A) are updated reduces prediction latency significantly (~22x speedup).
**Action:** When implementing bandit algorithms or Ridge Regression-based models, always cache the inverse of the covariance matrix and invalidate it only during model updates.

## 2026-04-01 - [Shortcutting Identity Filtering for Reference Stability]
**Learning:**Redundant traversals of large collections on every render create unnecessary GC pressure and break downstream memoization. Identifying the "unfiltered" state where the current subset already matches the target status allows for an $O(1)$ reference return.
**Action:** In complex data flows where collections are pre-partitioned, always implement an identity check in the final filtering memo to preserve original references when no secondary filters are active.

## 2026-04-03 - [Consolidated Recommendation Batching and O(1) History Replay]
**Learning:** Sequential Firestore writes in a tight history replay loop create a network-bound bottleneck. Transitioning to `batchTrain` for consolidated persistence reduces writes from O(N) to O(1). Passing the pre-identified `lastTask` between iterations in a sorted loop eliminates redundant O(N) array scans.
**Action:** Always collect training samples into a single list for batch processing when replaying historical data. When iterating over sorted chronological data, use index-based lookups for related items.

## 2026-04-04 - [Consolidating Strategy Heuristics in Bandits]
**Learning:** Within a Recommendation Engine using Multi-Armed Bandits, multiple strategy heuristics often iterate over the same task list to check for valid "arms". Chaining `.some()`, `.filter()`, and `.reduce()` calls inside a history replay loop leads to massive CPU overhead. Consolidating all strategy checks into a single $O(N)$ pass through the task list significantly improves both real-time generation and historical recalibration speed.
**Action:** When evaluating multiple conditions across a large collection (e.g., checking for valid strategies or building feature vectors), consolidate all checks into a single loop instead of using multiple functional passes.

## 2026-04-05 - [Timeline-Based Sliding Window for History Replay]
**Learning:** $O(N^2)$ history replay loops (caused by repeated filtering or slicing) can be reduced to $O(N \log N + N \cdot K)$ by using a timeline-based sliding window. Pre-sorting by creation and removal times and using pointers/maps allows for amortized $O(1)$ state updates per iteration.
**Action:** When replaying chronological history that depends on a "currently active" pool of items, avoid O(N) filters inside the loop. Use pre-sorted timelines and pointers to maintain the active set.

## 2026-04-06 - [Cross-Service Context Optimization]
**Learning:** Downstream services (like the `RecommendationEngine`) often perform redundant $O(N)$ searches for "hot" data (like the latest completed task or active ID sets) that were already identified by the calling controller during its initial data partitioning. Expanding the shared context object (`SuggestionContext`) to carry these pre-calculated values allows for $O(1)$ resolution in the engine without additional overhead in the controller.
**Action:** When passing large collections between services, identify "hot" items or lookup sets that are used for frequent checks (e.g., blocking tasks) and hoist their calculation to the primary data-partitioning pass.

## 2026-04-07 - [Hoisting Loop-Invariant Allocations]
**Learning:** Redundant allocations of static data structures inside hot loops or mapping functions (e.g., identity matrices in `Matrix.invert` or `ENERGY_MAP` in hooks) create unnecessary GC pressure and CPU overhead. Hoisting these to a higher scope reduces complexity and improves performance, especially for algorithms like LinUCB that perform frequent matrix inversions.
**Action:** Always identify and hoist loop-invariant objects or matrices out of mapping functions and render loops.

## 2026-04-11 - [In-place Matrix Updates and Theta Caching]
**Learning:** Model updates in bandit algorithms (like LinUCB) are allocation-heavy if new matrices are created on every sample. Implementing in-place updates ( = A + x x^T$) eliminates (d^2)$ allocations. Additionally, caching the Ridge Regression coefficients ($\theta = A^{-1}b$) reduces prediction complexity from (d^2)$ to (d)$ for the mean reward component, providing significant speedups in high-frequency recommendation paths.
**Action:** Use in-place mutations for large matrix/vector state updates and cache intermediate regression results ($\theta$) to minimize redundant linear algebra operations.
