## 2025-05-22 - [Performance Optimization in Task App]
**Learning:** Hoisting loop-invariant lookups like `tags.find` from filtering logic and using `useMemo` for O(1) map lookups in list rendering measurably improves UI responsiveness. Additionally, fine-grained Zustand selectors are crucial for preventing expensive re-renders in complex component trees.
**Action:** Always check for repeated array scans inside `useMemo` or `render` loops and replace with hoisted variables or map-based lookups. Use selective Zustand subscriptions to isolate component updates.
