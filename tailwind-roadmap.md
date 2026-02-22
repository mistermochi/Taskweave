
# Tailwind CSS Best Practices: Roadmap & Checklist

This document outlines a strategic plan to audit, refactor, and enforce best practices for using Tailwind CSS within the Taskweave application. The goal is to improve maintainability, reduce CSS bundle size, and ensure a consistent, theme-aware design system.

---

## 1. Most Pressing Concerns (The "Why")

1.  **Inconsistent Component Styling:** Many UI elements are styled with long, repetitive strings of utility classes. This makes updating styles tedious and error-prone. For example, buttons and cards are re-styled in multiple places.
2.  **Lack of Type-Safe Variants:** Conditional classes are often handled with template literals (`${...}`), which can become complex and are not type-safe. This makes it hard to know what variants a component supports.
3.  **Lingering Arbitrary Values:** Despite recent cleanup, some hardcoded colors and sizes (`bg-[#...]`, `w-[280px]`) still exist, bypassing the theme defined in `tailwind.config.ts` and `globals.css`.

---

## 2. The Plan: A Phased Refactoring Approach

### ✅ Epic 1: Establish Modern Variant Management with `cva`

The highest-leverage improvement is to introduce `class-variance-authority` (`cva`), the industry standard for creating reusable, type-safe component variants with Tailwind.

-   [x] **Install `cva`:** Add `class-variance-authority` to the project's dependencies.
-   [x] **Refactor `IconBadge`:** Convert the `IconBadge` component to use `cva` for its `variant` and `size` props. This will serve as the primary, easy-to-understand example for the new pattern.
-   [x] **Refactor `Chip` component:** Apply the `cva` pattern to the `Chip` component to handle its `active` and `editing` states.

### ✅ Epic 2: Abstract Reusable Layout Components

-   [x] **Create a `Card` component:** Abstract the common container style (`bg-surface`, `border`, `rounded-2xl`, etc.) used in `SettingsView`, `DashboardView`, and other panels into a single, reusable `Card` component.
-   [x] **Refactor `SettingsView`:** Replace all custom-styled `div` containers with the new `Card` component.
-   [x] **Refactor `DashboardView`:** Replace custom-styled panels with the new `Card` component.

### ✅ Epic 3: Eliminate All Arbitrary Values

-   [x] **Full Codebase Audit:** Systematically search for and replace any remaining hardcoded colors (`#[...]`) and arbitrary dimensions (`w-[...]`, `p-[...]`) with semantic theme variables from `globals.css` or values from `tailwind.config.ts`.
-   [x] **Update `BreathingView`:** Replace hardcoded background colors with semantic theme variables.
-   [x] **Update `Sidebar`:** Replace fixed-width values with the Tailwind theme config.

---

## 3. Adherence Checklist (The "How")

This checklist should be mentally reviewed before committing any new component code.

1.  **Is this a new component variant?**
    *   YES: Use `cva` to define the variants. Do not use template literals or inline conditional logic for classes.

2.  **Is this a repeated UI pattern?**
    *   YES: Abstract it into its own component. Do not copy and paste long class strings.

3.  **Am I using a color, font size, or spacing value?**
    *   YES: Use a predefined Tailwind class (`text-foreground`, `p-4`, `text-lg`).
    *   NO (the value is custom): Add the value to `tailwind.config.ts` with a semantic name first, then use the generated class. Do not use arbitrary values like `p-[13px]`.

4.  **Are my classes conditional?**
    *   YES: Use a utility like `clsx` (or similar) to combine classes cleanly. Do not use complex template literal strings.
