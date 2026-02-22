# Quickstart: Constitution Compliance Roadmap

## Overview

This guide explains how to execute the compliance roadmap to bring the codebase in line with constitutional principles VIII-XIII.

## Roadmap Summary

| Phase | Focus | Duration | Priority |
|-------|-------|----------|----------|
| 1 | Quick Wins | 1 sprint | P1 |
| 2 | Component Refactoring | 2 sprints | P1 |
| 3 | Architecture Improvements | 2 sprints | P2 |

## Phase 1: Quick Wins (1 sprint)

### 1.1 Configure ESLint

Add to `.eslintrc.json`:
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

### 1.2 Fix 'any' Types

Files with 'any' types to fix:
- `services/TaskService.ts` (3+ instances)
- `hooks/controllers/*.ts` (5+ instances)
- Various components (37 total)

### 1.3 Remove Empty Controller

Delete or implement: `hooks/controllers/useNewTaskController.ts`

**Exit Criteria**: ESLint rule enabled, 0 'any' types, no empty files

---

## Phase 2: Component Refactoring (2 sprints)

### 2.1 Split TaskRow

Current: 416 lines → Target: Multiple components under 250 lines

Suggested split:
- `TaskRow.tsx` - Container component
- `TaskRowDisplay.tsx` - Display mode
- `TaskRowEditor.tsx` - Edit mode
- `TaskRowTimer.tsx` - Timer logic
- `useTaskRowTimer.ts` - Timer hook

### 2.2 Split RecommendationEngine

Current: 530 lines → Target: Multiple services under 250 lines

Suggested split:
- `RecommendationEngine.ts` - Main orchestrator
- `LinUCBService.ts` - Algorithm implementation
- `RecommendationCache.ts` - Caching logic

### 2.3 Add React.memo

Add to:
- `TaskRow.tsx`
- Any list item components

**Exit Criteria**: All component files <250 lines

---

## Phase 3: Architecture Improvements (2 sprints)

### 3.1 Consolidate Context Providers

Current: 6 levels → Target: ≤3 levels

Strategy: Use useReducer with single context for complex state

### 3.2 Add React.lazy()

Add lazy loading for:
- Large views
- Heavy components (RecurrencePicker, etc.)
- Route-based code splitting

### 3.3 Set Up CI Health Gates

Add to CI pipeline:
```yaml
- npm run lint
- npm test
- Check: no new 'any' types
- Check: no files >250 lines
```

**Exit Criteria**: ≤3 context levels, lazy loading active, CI gates configured

---

## Verification Commands

```bash
# Check file sizes
wc -l components/*.tsx services/*.ts | awk '$1 > 250'

# Count 'any' types
grep -r ": any" --include="*.ts" --include="*.tsx" | wc -l

# Check context nesting
grep -c "Provider>" src/context/AppProvider.tsx
```

## Timeline

- Phase 1: Sprint 1
- Phase 2: Sprints 2-3
- Phase 3: Sprints 4-5
- **Total: 5 sprints to full compliance**
