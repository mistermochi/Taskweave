// Import from parent types directory
import { TaskEntity, Category, EnergyLevel, ContextSnapshot, UserVital, Tag } from '@/types';

// Re-export for convenience
export type { TaskEntity, Category, EnergyLevel, ContextSnapshot, UserVital, Tag } from '@/types';

// Types for AI Scheduling System

export interface SuggestionContext {
  currentTime: Date;
  energy: number; // 0-100 from dashboard
  availableMinutes: number;
  tasks: TaskEntity[];
  tags: Tag[];
  completedTasks: TaskEntity[]; // Added for momentum tracking
  backlogCount: number;
  previousPatterns: TaskPattern[];
  userContext?: ContextSnapshot; // Added optional context
}

export interface TaskPattern {
  taskCategory: Category;
  timeOfDay: number; // 0-23
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  energyLevel: number;
  completed: boolean;
  timestamp: number;
}

export interface Suggestion {
  id: string;
  taskId?: string; // Added: Link to actual task entity
  type: 'task' | 'wellbeing';
  title: string;
  reason: string;
  priority: number; // 1-10, higher is more important
  estimatedDuration: number; // minutes
  category?: Category;
  energyRequirement?: EnergyLevel;
  isUrgent?: boolean;
  confidence: number; // 0-100, how confident we are in this suggestion
}

export interface WellbeingActivity {
  id: string;
  title: string;
  description: string;
  duration: number; // minutes
  category: 'Wellbeing';
  energyRequirement: 'Low';
  type: 'stretching' | 'breathing' | 'water' | 'walk' | 'meditation' | 'social';
}

export interface AIPredictionRequest {
  userEnergy: number;
  availableMinutes: number;
  urgentTaskCount: number;
  backlogCount: number;
  context: ContextSnapshot; // Added context to AI request
  recentPatterns: {
    preferredCategories: Category[];
    peakProductivityHours: number[];
    averageTaskDuration: number;
    completionRate: number;
  };
  topTasks: {
    title: string;
    category: Category;
    duration: number;
    energy: EnergyLevel;
    isUrgent: boolean;
  }[];
}

export interface AIPredictionResponse {
  suggestions: {
    task: string;
    reason: string;
    confidence: number;
  }[];
}
