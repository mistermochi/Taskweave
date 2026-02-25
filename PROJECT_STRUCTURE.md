# Project Structure: Focus Flow

Focus Flow is a biometric-aware productivity system designed to adapt to user energy levels. It follows a modular architecture with a clear separation of concerns between data services, state management (context), and UI components.

## Directory Overview

### `/services`
The core business logic of the application. Services are typically implemented as singletons that handle specific domains:
- `AIService.ts`: Integration with Google Gemini for scheduling suggestions and calibration data.
- `TaskService.ts`: CRUD operations for tasks, including recurrence logic and focus session management.
- `ContextService.ts`: Aggregates environmental data (location, motion, time) into a unified context.
- `RecommendationEngine.ts`: The "brain" of the app, combining machine learning (LinUCB) and AI to suggest tasks.
- `LearningEngine.ts`: Manages user performance models and predictive analytics.
- `DeviceService.ts`: Low-level hardware interactions like haptic feedback and battery drain simulation.

### `/context`
React Context providers that manage global state and bridge services with the UI:
- `AppProvider.tsx`: The root provider handling Firebase Auth and service initialization.
- `TaskContext.tsx`: Real-time subscription to the user's task and tag database.
- `NavigationContext.tsx`: Manages complex application navigation, focus states, and modal visibility.
- `VitalsContext.tsx`: Exposes the user's energy model and mood trends.

### `/hooks`
Custom React hooks for shared logic:
- `/controllers`: View-specific logic (e.g., `useBreathingController`) to keep components lean.
- `useFirestore.ts`: Generic real-time data fetching from Firebase.
- `useTaskTimer.ts`: Manages the countdown and persistence for active focus sessions.

### `/components`
Reusable UI elements, organized by feature:
- `/ui`: Atomic design components (Buttons, Cards, Inputs).
- `FocusPlayer.tsx`: The main interface for an active focus session.
- `TaskRow.tsx`: A standard representation of a task across various lists.

### `/views`
Top-level page components switched by the `NavigationContext`:
- `DashboardView.tsx`: The primary "Focus" interface.
- `TaskDatabaseView.tsx`: Full inventory management.
- `InsightsView.tsx`: Productivity and wellness analytics.

### `/utils`
Pure utility functions for:
- `timeUtils.ts`: Duration formatting and recurrence calculations.
- `energyUtils.ts`: Normalization of mood and biometric data.
- `textParserUtils.ts`: Natural language processing for task creation.

### `/types`
TypeScript definitions and interfaces:
- `index.ts`: Core entities (Task, User, Tag).
- `scheduling.ts`: Recommendation-specific types.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Backend**: Firebase (Auth, Firestore)
- **AI**: Google Generative AI (Gemini)
- **Styling**: Tailwind CSS, Lucide Icons
- **Testing**: Jest, React Testing Library
