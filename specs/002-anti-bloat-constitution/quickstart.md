# Quickstart: Anti-Bloat Constitution Amendments

## Overview

This guide explains how to apply the anti-bloat constitutional amendments to the Taskweave project.

## Applying the Amendments

### Step 1: Update Constitution

Add the following new principles to `.specify/memory/constitution.md`:

```markdown
### VIII. Component Size Limits (NON-NEGOTIABLE)

Single files MUST NOT exceed:
- **250 lines** for any component or service file
- **50 lines** for any single function
- **5 props** maximum for React components

Files exceeding these limits MUST be split into smaller, focused modules.

### IX. Type Safety Enforcement (NON-NEGOTIABLE)

The 'any' type is strictly prohibited in production code. Enable ESLint rule `@typescript-eslint/no-explicit-any`.

### X. Code Duplication Tolerance

Duplicate code patterns MUST be refactored when:
- More than 3 consecutive lines are identical
- Same logic appears in more than 2 locations

### XI. Performance Budgets

- Initial JavaScript bundle under 200KB (compressed)
- Largest Contentful Paint under 2.5 seconds
- Time to Interactive under 3.5 seconds

### XII. Context Provider Consolidation

Maximum 3 levels of context nesting. Use useReducer for complex state.

### XIII. Automated Code Health Gates

All PRs MUST pass:
- No new 'any' types introduced
- No component files exceeding size limits
- No duplicate code patterns exceeding tolerance
- Lint passes
- Tests pass
```

### Step 2: Configure ESLint

Add or update `.eslintrc.json`:

```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "no-duplicate-lines": "error"
  }
}
```

### Step 3: Add Pre-commit Hook

Create `.husky/pre-commit` or update existing hook to run:
```bash
npm run lint
npm test
```

## Verification

After applying amendments:
1. Run `npm run lint` - should pass
2. Run `npm test` - should pass  
3. Check for any files exceeding 250 lines
4. Check for any `any` types in code

## Remediation Priorities

See `spec.md` Appendix C for prioritized list of fixes:
- **Immediate**: Enable ESLint rules
- **Short-term**: Split large components (TaskRow, RecommendationEngine)
- **Long-term**: Add automated CI checks
