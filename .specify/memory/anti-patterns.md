# Taskweave Anti-Patterns

**Last Updated**: 2026-02-22

This document catalogs architectural anti-patterns discovered in the Taskweave codebase to help developers avoid similar issues.

## Critical Severity

### 1. Bloated Root Page
- **Location**: `app/page.tsx` (120 lines)
- **Issue**: Multiple responsibilities mixed (auth, migration, sync)
- **Remediation**: Split into separate client components

## High Severity

### 2. Monster Component - TaskRow
- **Location**: `components/TaskRow.tsx` (416 lines)
- **Issue**: Handles display, editing, timer, NLP parsing, form state
- **Remediation**: Split into TaskRowDisplay, TaskRowEditor, TaskRowTimer

### 3. Monster Service - RecommendationEngine
- **Location**: `services/RecommendationEngine.ts` (530 lines)
- **Issue**: Unmaintainable, untestable
- **Remediation**: Break into smaller focused services

### 4. Excessive 'any' Types
- **Location**: 37 instances across codebase
- **Issue**: Type safety compromised
- **Remediation**: Add proper type definitions

## Medium Severity

### 5. Missing React.memo
- **Issue**: Unnecessary re-renders in list components
- **Remediation**: Add React.memo to TaskRow and other list items

### 6. Context Provider Nesting
- **Location**: `AppProvider.tsx` (6 levels deep)
- **Issue**: Re-render cascading
- **Remediation**: Consolidate to max 3 levels, use useReducer

### 7. Singleton Pattern Overuse
- **Location**: `ContextService.getInstance()` called 24 times
- **Issue**: Tight coupling, testing difficulty
- **Remediation**: Use dependency injection

### 8. No Code Splitting
- **Issue**: Large bundle sizes
- **Remediation**: Use React.lazy() for route-based splitting

### 9. Empty Controller File
- **Location**: `hooks/controllers/useNewTaskController.ts` (0 lines)
- **Remediation**: Remove or implement

## Notes

- Client-Side Dominated Application is NOT an anti-pattern - it's by design for client-only Firebase apps
- Firebase Credentials in client code are safe per Firebase documentation
