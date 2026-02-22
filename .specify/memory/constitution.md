# Taskweave Constitution

<!--
Sync Impact Report - Amendment 3
================================
Version: 1.2.0 → 1.3.0 (MINOR - new principles added)

Added Principles:
- VIII. Component Size Limits (NON-NEGOTIABLE)
- IX. Type Safety Enforcement (NON-NEGOTIABLE)
- X. Code Duplication Tolerance
- XI. Performance Budgets
- XII. Context Provider Consolidation
- XIII. Automated Code Health Gates

Modified Principles: None

Removed Sections: None

Templates Status:
- ✅ plan-template.md - No updates needed
- ✅ spec-template.md - No updates needed  
- ✅ tasks-template.md - No updates needed
- ✅ checklist-template.md - No constitution references

No follow-up TODOs.
-->

## Core Principles

### I. Exclusive Focus
Every feature MUST enforce single active task logic to maintain state integrity. The system ensures only one task can be in focus at any given time. Starting a new session automatically stops any other active session. This prevents cognitive overload and ensures data consistency.

### II. Atomic Operations
All data mutations MUST be clean and predictable. Each operation MUST be atomic - either fully completed or fully rolled back. No partial state changes are permitted. This ensures data integrity and simplifies debugging.

### III. Real-time First
All data access MUST leverage `onSnapshot` for instant UI updates across devices. Local state MUST sync immediately with Firestore. Optimistic updates are permitted only when they can be reconciled with server state.

### IV. Semantic Clarity
All user-facing terminology MUST use intuitive, user-friendly terms. Internal code MUST use terms that match user expectations. Examples: "Project" over "Category", "Task" over "Item". No jargon unless it improves precision.

### V. Offline Reliability
The application MUST function during intermittent connectivity. Local caching via Firebase Firestore persistence MUST maintain full functionality offline. Background sync MUST reconcile changes when connectivity returns. No operation should fail silently due to network issues.

### VI. Test-Driven Development (NON-NEGOTIABLE)
All features MUST follow the Red-Green-Refactor TDD cycle using Jest:

1. **Red**: Write a failing test first that describes the desired behavior
2. **Green**: Write minimum code to make the test pass
3. **Refactor**: Improve code while keeping tests passing

Test requirements:
- Use `@testing-library/react` for component tests
- Use `@testing-library/jest-dom` for DOM assertions
- Use `jest-environment-jsdom` for React testing environment
- Unit tests MUST achieve meaningful coverage for business logic
- Integration tests MUST verify component interactions
- Run `npm test` (Jest with `--watchAll=false`) before any PR

No feature is complete until tests pass. Tests document behavior and prevent regressions.

### VII. Client-Side Only Architecture
This project is strictly client-side only. All rendering and data operations happen in the browser:

- All components use 'use client' directive
- Firebase SDK is used directly from client code
- No Server Actions or server-side data mutations
- Offline-first with Firestore persistence and service workers
- All business logic executes in the browser

### VIII. Component Size Limits (NON-NEGOTIABLE)

Single files MUST NOT exceed:
- **250 lines** for any component or service file
- **50 lines** for any single function
- **5 props** maximum for React components

Files exceeding these limits MUST be split into smaller, focused modules. Use composition patterns to extract logic into custom hooks or utility functions.

### IX. Type Safety Enforcement (NON-NEGOTIABLE)

The 'any' type is strictly prohibited in production code. All functions, variables, and return types MUST have explicit type definitions. Use `unknown` with proper type guards when type is uncertain. Lint rule `@typescript-eslint/no-explicit-any` MUST be enabled and enforced.

### X. Code Duplication Tolerance

Duplicate code patterns MUST be refactored when:
- More than 3 consecutive lines are identical
- Same logic appears in more than 2 locations
- Logic could be extracted to a shared utility or hook

Use ESLint rules to detect and flag duplication.

### XI. Performance Budgets

All new code MUST adhere to performance budgets:
- Initial JavaScript bundle under 200KB (compressed)
- Largest Contentful Paint under 2.5 seconds
- Time to Interactive under 3.5 seconds

Use React.lazy() for route-based code splitting. Components larger than 100KB should be lazy-loaded.

### XII. Context Provider Consolidation

Context providers SHOULD be consolidated to minimize nesting depth. Maximum 3 levels of context nesting. Use useReducer with single context for complex state instead of multiple providers.

### XIII. Automated Code Health Gates

All PRs MUST pass automated checks before merge:
- No new 'any' types introduced
- No component files exceeding size limits
- No duplicate code patterns exceeding tolerance
- Lint passes
- TypeScript compilation succeeds
- Tests pass

Integrate these checks into CI/CD pipeline.

## Technology Stack

The following technologies MUST be used for all implementation:

- **Framework**: Next.js 14 (App Router) - Client-Side Only Architecture
- **Language**: TypeScript 5.3+
- **UI**: React 18 with Tailwind CSS and ShadCN UI
- **Backend**: Firebase (Firestore & Auth) - Client-side SDK only
- **Offline**: PWA standard with custom service workers and Firestore persistence
- **Firebase Security**: Firebase API keys in client code are safe and intended - Firebase uses key restrictions and security rules for protection

New dependencies MUST be evaluated for offline compatibility and type safety before adoption.

## Development Workflow

All feature development MUST follow the Specify methodology:

1. **Specification**: Create feature spec in `specs/[###-feature]/spec.md`
2. **Plan**: Create implementation plan with research and data model
3. **Tasks**: Generate task list organized by user story priority
4. **Implementation**: Implement with test-first approach
5. **Validation**: Verify against acceptance criteria

All PRs MUST verify:
- Tests pass (`npm test`)
- Lint passes (`npm run lint`)
- Build succeeds (`npm run build`)

## Governance

This Constitution supersedes all other practices. Amendments require:

1. Documentation of proposed changes with rationale
2. Review and approval via PR
3. Migration plan if changes affect existing features
4. Version bump following semantic versioning:
   - MAJOR: Backward incompatible governance/principle changes
   - MINOR: New principles or materially expanded guidance  
   - PATCH: Clarifications, wording, typo fixes

All team members MUST verify compliance with these principles before merging any changes.

**Version**: 1.3.0 | **Ratified**: 2026-02-22 | **Last Amended**: 2026-02-22
