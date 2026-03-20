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
