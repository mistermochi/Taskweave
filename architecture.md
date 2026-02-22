## Project Overview

**Taskweave** is a React/Next.js 14 productivity application that helps users manage tasks aligned with their energy levels. It uses Firebase Firestore for real-time data synchronization and implements a sophisticated context-aware recommendation system.

---

## 1. Directory Structure

```
/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with font/theme setup
│   ├── page.tsx                 # Main entry point with auth & AppProvider
│   └── globals.css              # Global styles
│
├── components/                   # React Components (organized by domain)
│   ├── ui/                      # Reusable UI primitives (Card, Dialog, Typography)
│   ├── pickers/                 # Form input components (Date, Duration, Energy, Tag)
│   ├── settings/                # Settings page components
│   ├── task-row/                # Task editing UI components
│   ├── dashboard/               # Dashboard-specific components
│   ├── layout/                  # Layout components (Page wrapper)
│   ├── AppContent.tsx           # Main app content with view routing
│   ├── AppLayout.tsx            # App shell with sidebar
│   ├── FocusPlayer.tsx          # Active focus session UI
│   ├── Sidebar.tsx              # Navigation sidebar
│   ├── TaskRow.tsx              # Individual task display
│   └── TaskSection.tsx          # Collapsible task list section
│
├── context/                      # React Context Providers
│   ├── AppProvider.tsx          # Root provider composing all contexts
│   ├── DataProviders.tsx        # Data layer providers (Environment, Reference, Vitals)
│   ├── AppStateProvider.tsx     # Application state providers
│   ├── NavigationContext.tsx    # View navigation & routing state
│   ├── TaskContext.tsx          # Active tasks data
│   ├── ReferenceContext.tsx     # Tags/reference data
│   ├── VitalsContext.tsx        # User vitals (mood, focus, etc.)
│   ├── ContextServiceContext.tsx # Contextual awareness service
│   └── EnvironmentContext.tsx   # Dev/prod environment detection
│
├── hooks/                        # Custom React Hooks
│   ├── controllers/             # View Controller hooks (business logic)
│   │   ├── useDashboardController.ts
│   │   ├── useTaskDatabaseController.ts
│   │   ├── useFocusSessionController.ts
│   │   ├── useInsightsController.ts
│   │   └── ...
│   ├── useFirestore.ts          # Firebase data fetching hooks
│   ├── useEnergyModel.ts        # Energy calculation model
│   ├── useTaskTimer.ts          # Task timing logic
│   ├── useTaskEditState.ts      # Task editing state management
│   ├── useContextService.ts     # Context service singleton hook
│   └── usePassiveDrain.ts       # Energy depletion over time
│
├── services/                     # Business Logic Services (Singleton Pattern)
│   ├── TaskService.ts           # CRUD operations for tasks
│   ├── ContextService.ts        # Contextual awareness aggregation
│   ├── RecommendationEngine.ts  # AI task suggestions
│   ├── TagService.ts            # Tag management
│   ├── UserConfigService.ts     # User settings
│   ├── DeviceService.ts         # Device context (battery, network)
│   ├── LocationService.ts       # Location context
│   ├── MotionService.ts         # Motion/activity detection
│   └── ...
│
├── views/                        # Page-Level View Components
│   ├── DashboardView.tsx
│   ├── TaskDatabaseView.tsx
│   ├── ChatView.tsx
│   ├── SettingsView.tsx
│   ├── InsightsView.tsx
│   ├── TaskHistoryView.tsx
│   ├── BreathingView.tsx
│   ├── SensoryGroundingView.tsx
│   └── LoginView.tsx
│
├── types.ts                      # TypeScript Type Definitions
├── firebase.ts                   # Firebase configuration
├── utils/                        # Utility functions
└── __tests__/                    # Jest test files
```

---

## 2. Component Organization

### Hierarchy Pattern

The components follow a **Container/Presentational** pattern with **View/Controller** separation:

```
Page (Route)
  └── View Component (views/*)
        └── Controller Hook (hooks/controllers/*)
              └── Context Providers (context/*)
                    └── Service Layer (services/*)
```

### Key Component Categories

1. **View Components** (`views/`): Page-level components that compose the UI
2. **UI Components** (`components/ui/`): Reusable, dumb presentational components
3. **Domain Components** (`components/pickers/`, `components/settings/`): Feature-specific components
4. **Layout Components** (`components/layout/`, `AppLayout.tsx`): Structural components

---

## 3. Context Architecture

### Provider Hierarchy

The contexts are organized in a hierarchical structure:

```
AppProvider (Root)
├── DataProviders
│   ├── EnvironmentProvider
│   ├── ReferenceProvider (Tags)
│   └── VitalsProvider (Mood/Focus data)
├── AppStateProvider
│   ├── ContextServiceProvider
│   ├── TaskProvider (Active tasks)
│   └── NavigationProvider (View state)
└── ThemeProvider
```

### Key Contexts

| Context | Purpose | Data Source |
|---------|---------|-------------|
| **TaskContext** | Active tasks state | Firestore: `users/{uid}/tasks` (status='active') |
| **ReferenceContext** | Tags/categories | Firestore: `users/{uid}/tags` |
| **VitalsContext** | User vitals (mood, focus) | Firestore: `users/{uid}/vitals` |
| **NavigationContext** | View routing state | Local React state |
| **ContextServiceContext** | Contextual awareness | Aggregated from device/location/motion |

### Context Pattern Example (TaskContext)

```typescript
// Provides active tasks with deep memoization for stability
const TaskContext = createContext<TaskContextType>({ 
  tasks: [], 
  tasksMap: {}, 
  loading: true 
});

// Uses useFirestoreCollection for real-time sync
const { data: activeTasks, loading } = useFirestoreCollection<TaskEntity>(
  'tasks', 
  [where('status', '==', 'active')]
);
```

---

## 4. Hook Organization & Patterns

### Controller Hooks Pattern

The application uses **Controller Hooks** that encapsulate business logic for each view:

```typescript
// hooks/controllers/useDashboardController.ts
export const useDashboardController = () => {
  // 1. Subscribe to context data
  const { tasks } = useTaskContext();
  const { vitals } = useVitalsContext();
  
  // 2. Compute derived state
  const sections = useMemo(() => categorizeTasks(tasks), [tasks]);
  
  // 3. Define actions
  const actions = useMemo(() => ({
    completeTask: async (task) => { ... },
    saveMood: async (level) => { ... }
  }), [...]);
  
  return { state: { sections, ... }, actions };
};
```

### Hook Categories

| Category | Examples | Purpose |
|----------|----------|---------|
| **Data Hooks** | `useFirestore.ts` | Firebase data fetching |
| **Controller Hooks** | `useDashboardController.ts` | View business logic |
| **Service Hooks** | `useContextService.ts` | Access singleton services |
| **Feature Hooks** | `useEnergyModel.ts`, `useTaskTimer.ts` | Specific domain logic |

---

## 5. Data Flow Architecture

### Data Flow Diagram

```
Firebase Firestore (Real-time)
    ↕ (onSnapshot)
useFirestore Hook
    ↓
React Context Providers
    ↓
Controller Hooks (Business Logic)
    ↓
View Components (UI)
    ↓
User Actions
    ↓
Service Layer (Services/*)
    ↓
Firebase Firestore (Write)
```

### Key Data Flow Patterns

1. **Real-time Sync**: All data subscriptions use Firestore `onSnapshot` for live updates
2. **Optimistic Updates**: UI updates immediately, then syncs with Firestore
3. **Selective Subscriptions**: Each context subscribes to only relevant data:
   - TaskContext: Only `status='active'` tasks
   - VitalsContext: Last 100 entries
4. **Memoization**: Heavy computation cached with `useMemo` to prevent re-renders

---

## 6. State Management

### State Management Approach

The application uses a **hybrid approach**:

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Server State** | Firebase Firestore | Persistent data (tasks, vitals, tags) |
| **Global UI State** | React Context | Navigation, auth, loading states |
| **Local UI State** | useState/useReducer | Form inputs, modals, temporary UI |
| **Computed State** | useMemo | Derived data (energy model, filtered tasks) |

### State Hierarchy

```
Global State (Firebase-backed)
├── Tasks (TaskContext)
├── Vitals (VitalsContext)
├── Tags (ReferenceContext)
└── Context Snapshot (ContextService)

Global UI State (React Context)
├── Navigation (NavigationContext)
└── Environment (EnvironmentContext)

Local State (Component-level)
├── Form inputs
├── Modal open/close
├── Section expansion
└── Search queries
```

### Firebase Data Model

**Collections** (per user: `users/{uid}/{collection}`):
- `tasks` - Task entities with status
- `vitals` - Mood, focus, journal entries
- `tags` - Categorization tags
- `activityLogs` - Completion events
- `settings` - User preferences

---

## 7. Service Layer Architecture

### Singleton Service Pattern

Services are implemented as **singletons** to manage Firebase interactions:

```typescript
export class TaskService {
  private static instance: TaskService;
  
  public static getInstance(): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return TaskService.instance;
  }
  
  // Business logic methods
  async completeTask(task, duration) { ... }
}
```

### Key Services

| Service | Responsibility |
|---------|--------------|
| **TaskService** | Task CRUD, completion, recurrence |
| **ContextService** | Aggregates device/location/temporal context |
| **RecommendationEngine** | AI task suggestions using contextual data |
| **TagService** | Tag management with defaults |
| **DeviceService** | Battery, network, online status |
| **LocationService** | GPS location with home/work detection |
| **MotionService** | Device motion activity detection |
| **UserConfigService** | User settings cache |

### Context-Awareness System

The ContextService aggregates multiple data sources:

```typescript
// services/ContextService.ts
async getSnapshot(): Promise<ContextSnapshot> {
  const [deviceContext, locationContext] = await Promise.all([
    this.deviceService.getDeviceStatus(),
    this.locationService.getLocationStatus(config),
  ]);
  const activityContext = this.motionService.getActivityStatus();
  
  return {
    location: locationContext,
    device: deviceContext,
    activity: activityContext,
    temporal: { hour, dayOfWeek, isWorkHours },
    environment: { isDaytime }
  };
}
```

---

## 8. Architectural Patterns & Observations

### Patterns Observed

1. **Provider Composition Pattern**: Clean hierarchy of nested providers with specific responsibilities
2. **Controller Pattern**: Business logic extracted into reusable controller hooks
3. **Singleton Services**: Services maintain single instance with `getInstance()`
4. **Real-time Data Sync**: Firestore `onSnapshot` for live data across all clients
5. **Lazy Loading**: Secondary views loaded with `React.lazy()` for performance
6. **Deep Memoization**: TaskContext uses object identity preservation to prevent re-renders
7. **Feature-Based Organization**: Components organized by feature/domain, not by type

### Anti-Patterns Observed

1. **ContextService Singleton**: The ContextService is both a singleton AND provided via React Context - potential confusion
2. **Mixed State Management**: Some state in Context, some in Services - needs clear conventions
3. **Large Controller Hooks**: Some controllers (like useDashboardController) are quite large and could be further decomposed
4. **Direct Firebase Access**: Some components directly import `db` from firebase.ts rather than using the service layer

### Strengths

- Clear separation of concerns between UI, business logic, and data
- Real-time synchronization with Firebase
- Contextual awareness system for intelligent recommendations
- Good TypeScript coverage with defined types
- Component composition patterns for flexible UI
- Lazy loading for performance optimization

### Recommendations

1. Consider unifying ContextService access (either singleton OR context, not both)
2. Standardize Firebase access through service layer exclusively
3. Break down large controller hooks into smaller, focused hooks
4. Add loading state management pattern across the app
5. Consider React Query/SWR for more sophisticated server state management

---

## Key Files Reference

| File | Role |
|------|------|
| `/app/page.tsx` | App entry, auth handling, migration logic |
| `/context/AppProvider.tsx` | Root provider composition |
| `/components/AppContent.tsx` | Main view router and layout |
| `/context/NavigationContext.tsx` | View routing and navigation state |
| `/context/TaskContext.tsx` | Active tasks data provider |
| `/services/TaskService.ts` | Task CRUD operations |
| `/services/ContextService.ts` | Contextual awareness aggregator |
| `/types.ts` | TypeScript type definitions |
| `/hooks/useFirestore.ts` | Firebase data fetching hooks |
