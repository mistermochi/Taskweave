# Implementation Plan: Fix Test Suite Failures

**Branch**: `001-fix-test-failures` | **Date**: 2026-02-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-fix-test-failures/spec.md`

## Summary

Fix 3 failing test files (`TaskService.test.ts`, `useFocusSessionController.test.ts`, `useTaskDatabaseController.test.ts`) by correcting mock configurations and assertion patterns. The implementation involves fixing UUID mocking, using flexible assertions, and properly mocking Firestore hooks. All 12 test files must pass to comply with Constitution VI (TDD).

## Technical Context

**Language/Version**: TypeScript 5.3+  
**Primary Dependencies**: Next.js 14, Firebase (Firestore & Auth), Jest 29.x  
**Storage**: Firebase Firestore (mocked in tests)  
**Testing**: Jest with @testing-library/react, jest-environment-jsdom  
**Target Platform**: Web (PWA)  
**Project Type**: Web application  
**Performance Goals**: N/A (test fixing)  
**Constraints**: All tests must pass; no breaking changes to implementation  
**Scale/Scope**: 12 test files in `__tests__/` directory

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| VI. TDD Compliance | 🔴 FAIL | Tests are failing; must fix before PR |
| Tests pass before PR | 🔴 FAIL | 3 test files failing |
| No implementation details in spec | ✅ PASS | Spec is requirements-focused |

**Gate Violation**: Constitution VI requires all features to pass tests. This feature IS the test fix, so passing gates is the deliverable.

## Project Structure

### Documentation (this feature)

```text
specs/001-fix-test-failures/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md            # Phase 2 output
```

### Source Code (repository root)

```text
__tests__/
├── TaskService.test.ts
├── useFocusSessionController.test.ts
├── useTaskDatabaseController.test.ts
├── timeUtils.test.ts
├── textParser.test.ts
├── useSessionSummaryController.test.ts
├── NavigationContext.test.tsx
├── LoginView.test.tsx
├── IconBadge.test.tsx
├── SmileyScale.test.tsx
├── TaskRow.test.tsx
└── QuickFocusModal.test.tsx

src/
├── services/
│   └── TaskService.ts
├── hooks/
│   └── controllers/
│       ├── useFocusSessionController.ts
│       └── useTaskDatabaseController.ts
└── [other source files]
```

**Structure Decision**: Tests are located in `__tests__/` ( Jest default). Source files are in `src/` following Next.js 14 App Router conventions.

## Phase 0: Research

### Unknowns Identified

The technical approach for fixing tests is well-established:

1. **UUID Mocking**: Use `jest.spyOn(crypto, 'randomUUID')` at module level
2. **Flexible Assertions**: Use `expect.any()` and `expect.objectContaining()` 
3. **Firestore Hook Mocking**: Mock at the exact import path used in source files

No additional research needed - this is a straightforward test remediation task.

## Phase 1: Design & Contracts

### Data Model (Test Fixtures)

| Entity | Fields | Purpose |
|--------|--------|---------|
| MockTask | id, title, status, duration, energy, category, createdAt, isFocused, remainingSeconds, lastStartedAt | TaskEntity fixture for tests |
| MockUser | uid, email | Auth context fixture |
| MockFirestoreCollection | data, loading, error | Firestore hook return value |

### Interface Contracts

This is an internal test fix - no external interfaces. Tests validate existing code behavior.

### Quick Reference

**Commands to verify fixes**:
```bash
npm test                              # Run all tests
npm test -- --testPathPattern=TaskService.test.ts  # Run specific file
```

**Mock patterns**:
```typescript
// UUID mock
jest.spyOn(crypto, 'randomUUID').mockReturnValue('mock-uuid')

// Flexible assertion
expect(mockFn).toHaveBeenCalledWith('task-1', expect.any(Number))

// Firestore hook mock
jest.mock('@/hooks/useFirestore', () => ({
  useFirestoreCollection: jest.fn().mockReturnValue({ data: [], loading: false }),
  useUserId: jest.fn().mockReturnValue('test-uid')
}))
```

## Complexity Tracking

> Not applicable - no Constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
