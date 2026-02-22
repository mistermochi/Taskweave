# Quickstart: Fix Test Suite Failures

**Phase**: 1 | **Date**: 2026-02-22

## Prerequisites

- Node.js 18+
- npm installed
- Project cloned locally

## Verification Commands

```bash
# Run all tests (should show 0 failures after fix)
npm test

# Run specific failing test files
npm test -- --testPathPattern=TaskService.test.ts
npm test -- --testPathPattern=useFocusSessionController.test.ts
npm test -- --testPathPattern=useTaskDatabaseController.test.ts
```

## Expected Output After Fix

```
Test Suites: 12 passed, 12 total
Tests:       XX passed, XX total
```

## Common Mock Patterns

### UUID Mock
```typescript
jest.spyOn(crypto, 'randomUUID').mockReturnValue('mock-uuid');
```

### Firestore Hook Mock
```typescript
jest.mock('@/hooks/useFirestore', () => ({
  useFirestoreCollection: jest.fn().mockReturnValue({ 
    data: [], 
    loading: false,
    error: null 
  }),
  useUserId: jest.fn().mockReturnValue('test-uid')
}));
```

### Flexible Assertion
```typescript
expect(mockFn).toHaveBeenCalledWith('task-1', expect.any(Number));
expect(mockFn).toHaveBeenCalledWith(
  expect.anything(),
  expect.objectContaining({ id: 'mock-uuid' })
);
```

## Next Steps

1. Fix TaskService.test.ts - UUID and parameter issues
2. Fix useFocusSessionController.test.ts - assertion matching
3. Fix useTaskDatabaseController.test.ts - Firestore hook mocking
4. Run `npm test` to verify all pass
5. Run `npm run lint` to verify code quality
