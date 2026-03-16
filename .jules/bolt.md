## 2025-05-22 - [Performance Optimization in Task App]
**Learning:** Hoisting loop-invariant lookups like `tags.find` from filtering logic and using `useMemo` for O(1) map lookups in list rendering measurably improves UI responsiveness. Additionally, fine-grained Zustand selectors are crucial for preventing expensive re-renders in complex component trees.
**Action:** Always check for repeated array scans inside `useMemo` or `render` loops and replace with hoisted variables or map-based lookups. Use selective Zustand subscriptions to isolate component updates.

## 2025-05-23 - [Redundant Firestore Subscriptions]
**Learning:** Top-level components often accidentally duplicate Firestore subscriptions that are already managed by global context providers. This creates redundant snapshot listeners, duplicate reconciliation work, and increased memory usage.
**Action:** Before calling `useFirestoreCollection` in a view, check if a global context (like `TaskContext` or `ReferenceContext`) already provides that data. Consolidate to a single source of truth to reduce CPU and network overhead.
