## 2025-05-22 - [Performance Optimization in Task App]
**Learning:** Hoisting loop-invariant lookups like `tags.find` from filtering logic and using `useMemo` for O(1) map lookups in list rendering measurably improves UI responsiveness. Additionally, fine-grained Zustand selectors are crucial for preventing expensive re-renders in complex component trees.
**Action:** Always check for repeated array scans inside `useMemo` or `render` loops and replace with hoisted variables or map-based lookups. Use selective Zustand subscriptions to isolate component updates.

## 2025-05-23 - [Redundant Firestore Subscriptions]
**Learning:** Top-level components often accidentally duplicate Firestore subscriptions that are already managed by global context providers. This creates redundant snapshot listeners, duplicate reconciliation work, and increased memory usage.
**Action:** Before calling `useFirestoreCollection` in a view, check if a global context (like `TaskContext` or `ReferenceContext`) already provides that data. Consolidate to a single source of truth to reduce CPU and network overhead.

## 2025-05-24 - [Lookup Map Collisions & Filter Reordering]
**Learning:** Mixing IDs and human-readable names in a single lookup map (e.g., `mergedTagsMap`) for "O(1) convenience" introduces a critical risk of collisions if a name matches an ID. Furthermore, in high-volume list filtering, reordering the filter callback to perform fast, highly-selective status checks before expensive string parsing or search matching significantly reduces CPU overhead for users with large histories.
**Action:** Use separate specialized maps for different key types (IDs vs names) to ensure safety. Always place the most selective and computationally cheapest filters at the top of iteration logic.

## 2025-05-25 - [Hot-Path Date Logic & Redundant Sorting]
**Learning:** Performing `new Date()` or complex `date-fns` calls (like `isToday`) inside large iteration loops (e.g., `TaskList` grouping) is a common source of CPU overhead and GC pressure. Pre-calculating DST-safe boundaries once outside the loop allows for fast numeric timestamp comparisons. Additionally, blindly sorting filtered arrays (e.g., `vitals`) is often redundant if the source context already provides sorted data via database constraints.
**Action:** Always pre-calculate date boundaries outside loops. Check upstream data providers for existing sort order before applying manual `.sort()`.

## 2025-05-26 - [Single-Pass Data Aggregation]
**Learning:** Chaining multiple higher-order functions (`filter`, `map`, `reduce`) over large arrays in data-heavy controllers (like `useInsightsController`) leads to redundant iterations and increased CPU overhead. Consolidating these operations into a single $O(N)$ `forEach` pass significantly improves performance as the dataset (e.g., user history) grows.
**Action:** When calculating multiple metrics from the same array, prioritize a single-pass aggregation loop over multiple specialized iterations.

## 2025-05-27 - [Algorithmic Optimization of Recommendation Engine]
**Learning:** Using $O(N \log N)$ sorting and repeated $O(N)$ filtering in hot loops (like history recalibration) leads to $O(N^2)$ complexity, which degrades rapidly for users with large histories. Replacing these with $O(N)$ linear scans and sliding pointers reduces complexity to $O(N \log N)$ or $O(N)$, significantly improving processing speed.
**Action:** Always prefer single-pass linear searches (`reduce`) or sliding pointers over sorting when identifying a single "best" element or processing chronological event streams. Use array slicing or index tracking instead of repeated filtering within loops.

## 2025-05-28 - [Reconciliation Optimization & Consolidated Mapping]
**Learning:** Performing array searches (`findIndex`, `find`) inside loops when merging optimistic UI state with server data creates an $O(N \cdot M)$ bottleneck. Converting the source array to a `Map` allows for $O(N + M)$ reconciliation. Additionally, multiple `useMemo` hooks that iterate over the same array to create different lookup maps can be consolidated into a single $O(T)$ pass to reduce iteration overhead.
**Action:** Use `Map`-based reconciliation for merging state and consolidate multiple lookup map iterations into a single pass.
