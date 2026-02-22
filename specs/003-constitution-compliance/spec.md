# Feature Specification: Constitution Compliance Roadmap

**Feature Branch**: `003-constitution-compliance`  
**Created**: 2026-02-22  
**Status**: Draft  
**Input**: User description: "Using our latest constitution and antipattern knowledge, create a roadmap to update the vault to comply to the latest rules."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Assess Current Compliance Gaps (Priority: P1)

The development team needs to understand which parts of the codebase violate the new constitutional rules.

**Why this priority**: Cannot fix problems without knowing what violates the rules.

**Independent Test**: Can generate a compliance report listing all violations.

**Acceptance Scenarios**:

1. **Given** the codebase, **When** analyzed against Constitution VIII-XIII, **Then** a complete list of violations is produced with file locations and severity.

2. **Given** a violation list, **When** reviewed, **Then** each violation is mapped to the specific constitutional principle it violates.

---

### User Story 2 - Prioritize Remediation Work (Priority: P1)

The team needs to prioritize which violations to fix first based on impact and effort.

**Why this priority**: Not all violations can be fixed at once; need a prioritized approach.

**Independent Test**: Violations are ranked by priority with clear rationale.

**Acceptance Scenarios**:

1. **Given** a list of violations, **When** prioritized, **Then** each violation has a priority level (Critical/High/Medium/Low) with effort estimate.

2. **Given** prioritized violations, **When** grouped into phases, **Then** each phase represents a manageable subset that can be completed in a sprint.

---

### User Story 3 - Execute Compliance Fixes (Priority: P2)

The team needs to systematically fix violations according to the roadmap.

**Why this priority**: The goal is full compliance, not just assessment.

**Independent Test**: Each completed phase shows measurable reduction in violations.

**Acceptance Scenarios**:

1. **Given** Phase 1 fixes are applied, **When** code is analyzed, **Then** the number of violations decreases by the expected amount.

2. **Given** all phases are complete, **When** compliance check runs, **Then** zero violations are reported.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST analyze the codebase against all constitutional principles (VIII-XIII)

- **FR-002**: System MUST produce a violation report with file paths, line numbers, and principle violated

- **FR-003**: Violations MUST be categorized by principle and severity

- **FR-004**: System MUST prioritize violations based on: impact on maintainability, effort to fix, risk of regression

- **FR-005**: Remediation phases MUST be defined with clear boundaries and exit criteria

- **FR-006**: Each phase MUST include automated verification that violations are fixed

### Key Entities *(include if feature involves data)*

- **Violation**: A specific instance of non-compliance with file path, line number, principle violated, and severity
- **Remediation Phase**: A grouping of related fixes with timeline and success criteria
- **Compliance Report**: A document summarizing current state, gaps, and roadmap

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A complete compliance assessment report exists documenting all violations

- **SC-002**: Violations are grouped into at least 3 phases with clear priorities

- **SC-003**: Each phase has measurable exit criteria (e.g., "reduce 'any' types from 37 to 0")

- **SC-004**: The roadmap shows estimated timeline for full compliance (e.g., "5 sprints")

---

## Proposed Remediation Phases

### Phase 1: Quick Wins (1 sprint)
- Configure ESLint `@typescript-eslint/no-explicit-any` rule
- Fix 37 'any' type instances
- Remove empty controller file

### Phase 2: Component Refactoring (2 sprints)
- Split TaskRow (416 → multiple components under 250 lines)
- Split RecommendationEngine (530 → multiple services under 250 lines)
- Add React.memo to list components

### Phase 3: Architecture Improvements (2 sprints)
- Consolidate context providers (6 → 3 levels)
- Add React.lazy() for code splitting
- Set up automated code health gates in CI

---

## Assumptions

The analysis assumes the existing codebase can be scanned programmatically. The roadmap will prioritize high-impact, low-effort fixes first. ESLint can be configured to detect most violations automatically.

---

## Clarifications

### Session 2026-02-22
- Q: Should we re-analyze the codebase or use existing anti-pattern data? → A: Use existing anti-pattern data from specs/002-anti-bloat-constitution directly

---

## Known Violations (from Anti-Pattern Analysis)

### Principle VIII - Component Size Limits (250 lines max)

| File | Current Lines | Severity |
|------|---------------|----------|
| `components/TaskRow.tsx` | 416 | Critical |
| `services/RecommendationEngine.ts` | 530 | Critical |
| `components/pickers/RecurrencePicker.tsx` | 268 | High |
| `components/task-row/TaskRowPickers.tsx` | 215 | Medium |

### Principle IX - Type Safety (no 'any' types)

| File | Instances | Severity |
|------|-----------|----------|
| `services/TaskService.ts` | 3+ | High |
| `hooks/controllers/*.ts` | 5+ | High |
| Various components | 37 total | High |

### Principle X - Code Duplication

| Pattern | Locations | Severity |
|---------|-----------|----------|
| ContextService.getInstance() | 24 calls | Medium |
| Duplicate utility functions | 3+ locations | Medium |

### Principle XII - Context Provider Consolidation

| File | Nesting Depth | Severity |
|------|---------------|----------|
| `AppProvider.tsx` | 6 levels | Medium |

### Principle XIII - Automated Code Health Gates

| Check | Status |
|-------|--------|
| ESLint no-explicit-any | Not configured |
| File size limits | Not enforced |
| Duplicate detection | Not configured |
