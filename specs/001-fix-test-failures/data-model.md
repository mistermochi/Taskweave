# Data Model: Test Fixtures

**Phase**: 1 | **Date**: 2026-02-22

## Test Fixtures

### MockTask (TaskEntity)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique task identifier |
| title | string | Yes | Task title |
| status | 'active' \| 'completed' \| 'archived' | Yes | Task state |
| category | string | Yes | Task category |
| duration | number | Yes | Planned duration in minutes |
| energy | 'Low' \| 'Medium' \| 'High' | Yes | Energy level required |
| createdAt | number | Yes | Unix timestamp |
| updatedAt | number | Yes | Unix timestamp |
| dueDate | number \| null | No | Due date timestamp |
| assignedDate | number \| null | No | Scheduled date timestamp |
| isFocused | boolean | No | Whether task has active session |
| remainingSeconds | number \| null | No | Remaining time in seconds |
| lastStartedAt | number \| null | No | When session started |
| blockedBy | string[] | No | IDs of blocking tasks |
| notes | string | No | Task notes |
| recurrence | RecurrenceConfig \| null | No | Recurrence rules |

---

### MockFirestoreCollection

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| data | T[] | Yes | Array of documents |
| loading | boolean | Yes | Loading state |
| error | Error \| null | Yes | Error state if any |

---

### MockUser

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| uid | string | Yes | User ID |
| email | string | No | User email |

---

## State Transitions

### Task Status Flow
```
active → completed (completeTask)
active → archived (archiveTask)
archived → active (unarchiveTask)
```

### Session State Flow
```
idle (no session) → running (startSession)
running → paused (pauseSession)
paused → running (resume/startSession)
running → idle (completeSession/stopSession)
```

---

## Validation Rules

- Task IDs must be valid UUIDs (or mocked strings in tests)
- Durations must be positive integers (minutes)
- Timestamps must be Unix epoch milliseconds
- Energy levels must be one of: 'Low', 'Medium', 'High'
