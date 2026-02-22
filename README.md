# Taskweave: Product Specification

## 1. Vision & Philosophy

Taskweave is a holistic productivity and wellness application designed for the modern knowledge worker, student, and creator. It operates on a simple yet profound principle: true productivity is not about doing more, but about doing the right things at the right time, in alignment with one's natural energy levels.

Unlike traditional task managers that focus solely on deadlines and lists, Taskweave serves as an intelligent companion. It learns an individual's unique rhythms, predicts their capacity for work, and proactively suggests actions that balance deep focus with essential recovery. It is a calm, context-aware system designed to prevent burnout by integrating mindfulness and self-awareness directly into the workflow.

## 2. Core Features

### 2.1. Intelligent Task Management
- **Structured Inbox:** A central place for all tasks, which can be quickly created using natural language parsing to set due dates, projects, duration, and energy requirements.
- **Smart Scheduling:** Tasks can be assigned to specific days ("Today", "Upcoming") or left in the Inbox for the AI to schedule.
- **Project Organization:** A flexible, hierarchical project system (using tags) allows for nested organization of work and personal life.
- **Dependencies:** Tasks can be marked as "blocked by" other tasks, preventing them from being started until prerequisites are met.
- **Recurrence Engine:** A robust system for creating repeating tasks with daily, weekly, monthly, and yearly schedules.

### 2.2. Exclusive Focus Mode
- **Persistent Player:** A non-intrusive player at the bottom of the screen provides constant access to the active focus session.
- **Exclusive Session Guarantee:** The system ensures only one task can be in focus at any given time. Starting a new session automatically stops any other active session.
- **Session Control:** Users can play, pause, or explicitly stop a session to return to their main task list without losing progress.
- **Session Summary:** Upon completing a session, users log mood and reflections, which feeds back into the energy model.

### 2.3. AI & Energy-Aware Scheduling
- **Readiness Score:** A dynamic score (0-100) representing capacity for work, influenced by mood, task completion, and natural energy depletion.
- **AI-Powered Suggestions:** An engine suggests the next best task based on energy, time of day, and learned work patterns.
- **AI Chat Coach:** "Aura" provides space for reflection, journaling, and context-aware advice.

### 2.4. Wellness & Mindfulness
- **Guided Breathing:** Animated breathing exercises to calm the nervous system.
- **Sensory Grounding:** A "5-4-3-2-1" grounding exercise to reduce anxiety.

## 3. Key Tech Stack

- **Framework:** **Next.js (App Router)** for optimized performance and routing.
- **Language:** **TypeScript** for strict type safety and maintainability.
- **UI:** **React 18** with **Tailwind CSS** and **ShadCN UI** for a modern, responsive design system.
- **Backend:** **Firebase (Firestore & Auth)** for real-time synchronization and secure identity management.
- **Offline:** **Progressive Web App (PWA)** standard with custom service workers and Firestore persistence.

## 4. Development Principles

- **Exclusive Focus:** Enforce a single active task logic to maintain state integrity.
- **Atomic Operations:** Ensure data mutations are clean and predictable.
- **Real-time First:** Leverage `onSnapshot` for instant UI updates across devices.
- **Semantic Clarity:** Standardize on user-friendly terms (e.g., "Project" over "Category").
- **Offline Reliability:** Design for intermittent connectivity using local caching and background sync.
- **Context Awareness:** Integrate device sensors (battery, location, motion) to refine AI suggestions.
