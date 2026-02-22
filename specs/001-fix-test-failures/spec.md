# Feature Specification: Fix Test Suite Failures

**Feature Branch**: `001-fix-test-failures`  
**Created**: 2026-02-22  
**Status**: Draft  
**Input**: User description: "Perform comprehensive analysis on the current test suites. What tests are failing, what methods we can implement to remediate, and whether the test cases are well written on the first hand"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fix TaskService.test.ts Failures (Priority: P1)

As a developer, I need the TaskService unit tests to pass so that I can verify task management functionality works correctly.

**Why this priority**: Critical path - TaskService handles core task CRUD operations, without passing tests developers cannot confidently make changes.

**Independent Test**: Can be validated by running `npm test -- --testPathPattern=TaskService.test.ts`

**Acceptance Scenarios**:

1. **Given** the test suite, **When** `addTask` test runs, **Then** it should create a task with mocked UUID matching expected ID
2. **Given** the test suite, **When** `startSession` test runs, **Then** it should pass the required `allActiveTasks` parameter without TypeError
3. **Given** the test suite, **When** `logSessionCompletion` test runs, **Then** it should create vitals with mocked UUID

---

### User Story 2 - Fix useFocusSessionController.test.ts Failures (Priority: P1)

As a developer, I need the focus session controller tests to pass so that I can verify timer functionality works correctly.

**Why this priority**: Critical path - Focus sessions are a core feature, without passing tests the timer functionality cannot be safely modified.

**Independent Test**: Can be validated by running `npm test -- --testPathPattern=useFocusSessionController.test.ts`

**Acceptance Scenarios**:

1. **Given** the test suite, **When** auto-start session test runs, **Then** it should match flexible argument assertions (task ID + any number)
2. **Given** the test suite, **When** toggle timer test runs, **Then** it should handle variable argument counts from implementation

---

### User Story 3 - Fix useTaskDatabaseController.test.ts Failures (Priority: P1)

As a developer, I need the task database controller tests to pass so that I can verify task sectioning and filtering logic works correctly.

**Why this priority**: Critical path - Task sectioning is central to the UI, without passing tests the task organization feature cannot be safely modified.

**Independent Test**: Can be validated by running `npm test -- --testPathPattern=useTaskDatabaseController.test.ts`

**Acceptance Scenarios**:

1. **Given** the test suite, **When** `useFirestoreCollection` is mocked, **Then** it should return valid data structure for destructuring
2. **Given** the test suite, **When** tests run, **Then** they should not throw TypeError on undefined destructuring

---

### User Story 4 - Improve Test Quality (Priority: P2)

As a developer, I want test mocks to be properly configured so that future test failures are easier to diagnose.

**Why this priority**: Technical debt - Poor mock setup causes cascading failures that obscure root causes.

**Independent Test**: Can be validated by running all tests and checking for proper mock initialization

**Acceptance Scenarios**:

1. **Given** a new test file, **When** it requires Firestore mocking, **Then** it should use consistent mock patterns
2. **Given** any test, **When** it uses UUID generation, **Then** mocks should intercept at the correct module level

---

### Edge Cases

- What happens when a new test is added that uses Firebase Auth? (Ensure auth mocks are consistent)
- How does the system handle tests that require real async Firestore calls? (Document when to use real implementations vs mocks)
- What if new Firebase SDK versions change API signatures? (Add guidance for maintaining mock compatibility)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The test suite MUST have all 12 test files passing without errors
- **FR-002**: TaskService.test.ts MUST fix UUID mocking to return consistent 'mock-uuid'
- **FR-003**: TaskService.test.ts startSession test MUST pass all required parameters to the implementation
- **FR-004**: useFocusSessionController.test.ts assertions MUST use flexible matching for variable arguments
- **FR-005**: useTaskDatabaseController.test.ts MUST properly mock `useFirestoreCollection` at the correct import level
- **FR-006**: All test files MUST properly mock Firebase dependencies (Auth, Firestore, Storage)
- **FR-007**: Console warnings about deprecated Firebase APIs MUST be suppressed in test environment
- **FR-008**: Test mock patterns SHOULD be documented for future test creation

### Key Entities *(include if feature involves data)*

- **Test Mock Configuration**: Shared mock setup that all tests can import
- **Firestore Mock Data**: Sample task entities for testing sectioning logic
- **UUID Generator**: Mocked randomUUID function for deterministic tests

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `npm test` executes with 0 failures and 0 errors
- **SC-002**: All 12 test files run and pass within 60 seconds
- **SC-003**: Test output shows clear pass/fail status for each test suite
- **SC-004**: No TypeError or undefined reference exceptions in test output
- **SC-005**: Console warnings from Firebase are suppressed or filtered

---

## Assumptions

- The project uses Jest as the testing framework (confirmed in package.json)
- Firebase Firestore and Auth are the primary backend services (confirmed in codebase)
- Tests are located in `__tests__/` directory (confirmed)
- The project uses TypeScript 5.3+ (confirmed in package.json)
