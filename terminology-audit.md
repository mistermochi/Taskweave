# Terminology Audit & Recommendations

## 1. Executive Summary

This document outlines a full audit of user-facing terminology within the Taskweave application. The goal is to enhance user experience by ensuring all labels, instructions, and feedback are simple, consistent, and clear. By standardizing our language, we reduce cognitive load and make the application more intuitive to use.

---

## 2. Key Terminology Decisions

After a full review, the following core terminology has been standardized:

1.  **"Project" over "Category"**:
    *   **Decision:** All user-facing text should use the word **"Project"**.
    *   **Reasoning:** "Project" is a more tangible and universally understood concept for grouping tasks than the more abstract "Category". This is already used in the sidebar and is more intuitive for users.
    *   **Note:** The internal data model can continue to use \`TaskEntity.category\` as the field name to minimize code disruption.

2.  **"Due Date" and "Schedule Date" for Dates**:
    *   **Decision:** Use **"Due Date"** for deadlines (\`dueDate\`) and **"Schedule Date"** for planned work days (\`assignedDate\`).
    *   **Reasoning:** "Deadline" can feel stressful and rigid. "Due Date" is a neutral, standard term. "Do Date" is too informal, while "Schedule Date" clearly communicates the user's intent to plan a task for a specific day.

---

## 3. Recommended Component Changes

Based on the decisions above, the following specific changes are recommended to align the UI.

### Round 1

| Component File | Current Text | Recommended Text | Reasoning |
| :--- | :--- | :--- | :--- |
| `QuickFocusModal.tsx` | `Category` (label) | `Project` | Standardize on "Project". |
| `DatePicker.tsx` | `Deadline` (title) | `Due Date` | Standardize on "Due Date". |
| `DatePicker.tsx` | `Do Date` (title) | `Schedule Date` | Use clearer, more formal term. |
| `DependencyPicker.tsx`| `Dependencies` (title) | `Set Dependencies` | More action-oriented for an editor. |
| `DependencyPicker.tsx`| `Done After (...)` | `This task is blocked by:` | More direct and consistent with UI tooltips. |
| `RecurrencePicker.tsx`| `Repeat Rule` (title) | `Recurrence` | Standard, simpler term. |
| `TaskRowPickers.tsx` | `Once` (chip label) | `Repeat` | More of a call-to-action for an interactive element. |

### Round 2

| Component File | Current Text | Recommended Text | Reasoning |
| :--- | :--- | :--- | :--- |
| `components/task-row/TaskRowPickers.tsx` | `Dependencies` (chip label) | `Blocks` | "Blocks" is a more active and concise term that clearly indicates the relationship between tasks. It's also more consistent with the "This task is blocked by" text in the `DependencyPicker`. |
| `components/pickers/DurationPicker.tsx` | `Task Duration` | `Set Duration` | "Set Duration" is more action-oriented and consistent with the other picker titles. |
| `components/pickers/EnergyPicker.tsx` | `Energy Level` | `Set Energy` | "Set Energy" is more action-oriented and consistent with the other picker titles. |
| `components/pickers/TagPicker.tsx` | `Select a Tag` | `Set Project` | "Set Project" is more action-oriented and consistent with the other picker titles. |
| `components/pickers/TagPicker.tsx` | `No tags found.` | `No projects found.` |  To standardize on "Project". |

### Round 3

| Component File | Current Text | Recommended Text | Reasoning |
| :--- | :--- | :--- | :--- |
| `components/sidebar/ProjectList.tsx` | `New Project` | `Create Project` | "Create Project" is a more descriptive and action-oriented label for the button that initiates the project creation process. |
| `components/sidebar/ProjectList.tsx` | `No projects yet.` | `No projects created.` | "No projects created" is a more informative and encouraging message for new users. |
| `app/page.tsx` | `Good morning` | `Focus for today` | "Focus for today" is more aligned with the app's purpose of helping users manage their tasks and focus on their priorities. |
| `app/settings/page.tsx` | `Taskweave Settings` | `Settings` | "Settings" is a more concise and standard header for the settings page. |

### Round 4

| Component File | Current Text | Recommended Text | Reasoning |
| :--- | :--- | :--- | :--- |
| `views/DashboardView.tsx` | `Focus Bank` | `Focus Time` | "Focus Time" is more descriptive and less jargony than "Focus Bank", clearly communicating the total time spent in focus sessions. |
| `views/InsightsView.tsx`| `Your Rhythm` | `Your Progress` | "Progress" is more direct and universally understood in a productivity context than the more abstract "Rhythm". |
| `views/InsightsView.tsx`| `Weekly Performance` | `Insights & Patterns`| "Insights & Patterns" more accurately describes the page's purpose of analyzing work habits over time. |
| `views/InsightsView.tsx`| `Tasks finished` | `Tasks completed` | Standardizes on "completed", which is a more common term in task management apps than "finished". |
| `components/task-list/TaskList.tsx` | `Overdue` (section header) | `Past Due` | "Past Due" is a slightly less stressful term than "Overdue", better aligning with the app's "calm productivity" goal. |

---

## 4. Audit Conclusion

The overall terminology in Taskweave is strong and generally consistent with its "calm productivity" ethos. The recommendations above address the few remaining inconsistencies. Implementing these changes will create a more polished, predictable, and user-friendly experience.
