# Feature Specification: Anti-Bloat Constitution Amendments

**Feature Branch**: `002-anti-bloat-constitution`  
**Created**: 2026-02-22  
**Status**: Draft  
**Input**: User description: "we have become a super large vault due to prolonged Ai assisted programming and multiple refactoring effort. Look through the vault and find important architectural failure and deviation from nextjs best practices. Suggest edits we can put onto the constitution to mitigate continuous 'bloating' of the vault."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Document Architectural Anti-Patterns (Priority: P1)

The development team needs a documented set of anti-patterns discovered in the current codebase to understand what practices to avoid.

**Why this priority**: Without clear documentation of what went wrong, future development will repeat the same mistakes.

**Independent Test**: The anti-patterns list can be validated by checking if existing code exhibits any of the documented issues.

**Acceptance Scenarios**:

1. **Given** a comprehensive code analysis, **When** examining the codebase, **Then** all significant architectural failures are documented with specific file locations and severity levels.

2. **Given** the documented anti-patterns, **When** new developers review them, **Then** they can identify similar patterns in their own code.

---

### User Story 2 - Propose Constitutional Amendments (Priority: P1)

The team needs concrete constitutional rules that, if followed, would prevent the identified anti-patterns from recurring.

**Why this priority**: The constitution is the governing document for all development; amendments here will have system-wide impact on preventing bloat.

**Independent Test**: Each proposed amendment can be verified by checking if it addresses a specific identified anti-pattern.

**Acceptance Scenarios**:

1. **Given** identified anti-patterns, **When** drafting amendments, **Then** each amendment directly addresses at least one anti-pattern.

2. **Given** proposed amendments, **When** reviewed by team, **Then** they are specific enough to be enforceable and measurable.

---

### User Story 3 - Establish Code Health Gates (Priority: P2)

The team needs automated checks to enforce constitutional rules and prevent bloat from being introduced.

**Why this priority**: Manual enforcement is unreliable; automated gates ensure consistent application of anti-bloat rules.

**Acceptance Scenarios**:

1. **Given** new code commits, **When** submitted to version control, **Then** automated checks verify compliance with size and complexity limits.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST document all architectural anti-patterns discovered in the current codebase with severity levels (Critical, High, Medium, Low)

- **FR-002**: System MUST propose constitutional amendments addressing each critical and high-severity anti-pattern

- **FR-003**: Constitutional amendments MUST be specific enough to enforce via automated checks

- **FR-004**: System MUST establish component size limits (single files under 250 lines, single functions under 50 lines)

- **FR-005**: System MUST establish rules preventing client-side dominance (require justification for 'use client' directives)

- **FR-006**: System MUST establish type safety requirements (zero tolerance for 'any' types in production code)

- **FR-007**: System MUST establish code duplication tolerance (max 3 duplicate lines before refactoring required)

- **FR-008**: REMOVED - Project is client-side only

### Key Entities *(include if feature involves data)*

- **Anti-Pattern**: A documented architectural issue with severity, location, and remediation guidance
- **Constitutional Amendment**: A rule added to the constitution with enforcement mechanism
- **Code Health Gate**: An automated check that validates compliance with constitutional rules

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 10 architectural anti-patterns are documented with severity levels and file locations

- **SC-002**: At least 5 constitutional amendments are proposed addressing the identified anti-patterns

- **SC-003**: All proposed amendments are specific enough to be validated via automated checks

- **SC-004**: New code contributions maintain or improve code health metrics (no increase in 'use client' directives, 'any' types, or component sizes)

---

## Assumptions

The analysis assumes Next.js 14 App Router is the target framework with **client-side only** architecture. Firebase is the backend. The proposed amendments follow the existing constitution format and governance structure.

**Important Constraint**: This project is strictly client-side only. All amendments must focus on client-side patterns. Server Actions are not applicable.

---

## Clarifications

### Session 2026-02-22
- Q: How should the spec handle Server Actions requirements given the client-only architecture? → A: Remove Server Actions requirements; focus amendments on client-only patterns
- Q: Firebase Credentials Exposed is listed as anti-pattern → A: Remove from anti-patterns - safe for client-only Firebase apps per Firebase docs
- Q: Appendix B VII Server-First Architecture needs update → A: Replace with Client-Side Architecture Conventions

---

## Appendix A: Identified Anti-Patterns

### Critical Severity

1. **Client-Side Dominated Application** (34 files with 'use client')
   - Location: `app/page.tsx`, `views/*.tsx`, `components/settings/*`
   - Impact: Not an issue - client-only architecture is intentional

2. **Bloated Root Page**
   - Location: `app/page.tsx` (120 lines)
   - Impact: Multiple responsibilities mixed (auth, migration, sync)

### High Severity

3. **Monster Component - TaskRow**
   - Location: `components/TaskRow.tsx` (416 lines)
   - Impact: Handles display, editing, timer, NLP parsing, form state

4. **Monster Service - RecommendationEngine**
   - Location: `services/RecommendationEngine.ts` (530 lines)
   - Impact: Unmaintainable, untestable

5. **Excessive 'any' Types**
   - Location: 37 instances across codebase
   - Impact: Type safety compromised

### Medium Severity

6. **Missing React.memo**
   - Impact: Unnecessary re-renders in list components

7. **Context Provider Nesting**
   - Location: `AppProvider.tsx` (6 levels deep)
   - Impact: Re-render cascading

8. **Singleton Pattern Overuse**
   - Location: `ContextService.getInstance()` called 24 times
   - Impact: Tight coupling, testing difficulty

9. **No Code Splitting**
   - Impact: Large bundle sizes

10. **Empty Controller File**
    - Location: `hooks/controllers/useNewTaskController.ts` (0 lines)

---

## Appendix B: Proposed Constitutional Amendments

### VII. Client-Side Architecture Conventions (NON-NEGOTIABLE)

This is a client-only application using Firebase SDK directly from the browser. All components use 'use client' directive by design.

Conventions:
- All components use 'use client' directive (by design for client-only Firebase apps)
- Firebase SDK is used directly from client code - this is the intended pattern
- Service workers enable offline functionality
- Firestore persistence handles offline data

Every new file MUST include a comment explaining its purpose. Complex logic MUST be extracted to custom hooks.

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
- No increase in 'use client' directives
- No new 'any' types introduced
- No component files exceeding size limits
- No duplicate code patterns exceeding tolerance
- Lint passes
- TypeScript compilation succeeds
- Tests pass

Integrate these checks into CI/CD pipeline.

---

## Appendix C: Remediation Priorities

### Immediate (Before Next Release)
1. Remove exposed Firebase credentials from `firebase.ts`
2. Add 'use client' justification comments
3. Enable ESLint rule for 'any' types

### Short-Term (Within 2 Sprints)
1. Split TaskRow component into focused sub-components
2. Add React.memo to list components
3. Consolidate context providers

### Long-Term (Quarter Goal)
1. Implement lazy loading for large components
2. Add automated code health gates to CI
3. Reduce context provider nesting to max 3 levels
