import { useState, useEffect, useCallback, useMemo } from 'react';
import { Suggestion, SuggestionContext } from '@/types/scheduling';
import { LocalSchedulingEngine } from '@/services/LocalSchedulingEngine';
import { AIService } from '@/services/AIService';
import { LearningEngine } from '@/services/LearningEngine';
import { contextApi } from '@/entities/context';
import { ViewName, NavigationHandler } from '@/types';
import { useTaskContext } from '@/context/TaskContext';
import { useReferenceContext } from '@/context/ReferenceContext';
import { useNavigation } from '@/context/NavigationContext';

/**
 * View Controller for the Scheduling/Recommendation interface.
 * Coordinates multiple engines (Local Heuristics, Machine Learning, and AI) to
 * provide prioritized suggestions for the user's next action.
 *
 * @param onNavigate - Optional handler for cross-view navigation (e.g. going to Breathing).
 * @returns State (suggestions, loading, energy) and Actions (generate, accept, refresh, skip).
 */
export const useSchedulingController = (onNavigate?: NavigationHandler) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEnergy, setCurrentEnergy] = useState(75);
  const [error, setError] = useState<string | null>(null);

  const localEngine = useMemo(() => LocalSchedulingEngine.getInstance(), []);
  const learningEngine = useMemo(() => new LearningEngine(), []);
  const aiService = useMemo(() => new AIService(), []);
   // contextService consolidated
  const { focusOnTask } = useNavigation();
  
  const { tasks: allTasks } = useTaskContext();
  const { tags } = useReferenceContext();

  /** Extracts only active tasks for recommendation context. */
  const activeTasks = useMemo(() => 
    allTasks.filter(t => t.status === 'active'),
  [allTasks]);

  /** Extracts completed tasks for historical context. */
  const completedTasks = useMemo(() => 
    allTasks.filter(t => t.status === 'completed'),
  [allTasks]);
  
  const backlogCount = activeTasks.length;
  const userEnergy = currentEnergy;

  /**
   * Generates a new set of suggestions.
   * Pulls data from environmental sensors and historical behavior logs
   * to build a comprehensive `SuggestionContext` for the engines.
   */
  const generateSuggestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const currentTime = new Date();
      const availableMinutes = 120;
      const userContext = await contextApi.getSnapshot();
      const previousPatterns = await learningEngine.getLearnedPatterns();

      const context: SuggestionContext = {
        currentTime,
        energy: userEnergy,
        availableMinutes,
        tasks: activeTasks,
        tags,
        completedTasks,
        backlogCount,
        previousPatterns,
        userContext 
      };

      const localResult = localEngine.generateSuggestions(context);
      setSuggestions(localResult.suggestions);
      setIsLoading(false);

    } catch (err) {
      setError('Failed to generate suggestions');
      setIsLoading(false);
      console.error('Scheduling error:', err);
    }
  }, [activeTasks, completedTasks, backlogCount, userEnergy, learningEngine, localEngine, tags]);

  useEffect(() => {
    if (activeTasks.length > 0) {
      generateSuggestions();
    }
  }, [activeTasks, backlogCount, userEnergy, generateSuggestions]);

  /**
   * Handles the user's decision to act on a suggestion.
   * If a task, it sets it as the active focus.
   * If a wellbeing activity, it navigates to the relevant tool.
   *
   * @param suggestionId - The unique ID of the accepted suggestion.
   */
  const acceptSuggestion = useCallback(async (suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    try {
      if (suggestion.type === 'task') {
        const task = activeTasks.find(t => t.title === suggestion.title);
        if (task) {
          focusOnTask(task.id);
        }
      } else if (suggestion.type === 'wellbeing') {
        onNavigate?.(ViewName.BREATHING);
      }
    } catch (err) {
      setError('Failed to accept suggestion');
      console.error('Accept suggestion error:', err);
    }
  }, [suggestions, activeTasks, onNavigate, focusOnTask]);

  const refreshSuggestions = useCallback(() => {
    generateSuggestions();
  }, [generateSuggestions]);

  /**
   * Removes the top suggestion and shifts the list.
   */
  const skipSuggestion = useCallback(() => {
    if (suggestions.length > 0) {
      setSuggestions(suggestions.slice(1));
    }
  }, [suggestions]);

  /**
   * Updates the local energy state for simulation/adjustment.
   */
  const updateEnergy = useCallback((newEnergy: number) => {
    setCurrentEnergy(newEnergy);
  }, []);

  const usageStats = aiService.getUsageStats();

  return {
    state: {
      suggestions,
      isLoading,
      error,
      currentEnergy,
      usageStats,
      hasAIAccessibility: false
    },
    actions: {
      generateSuggestions,
      acceptSuggestion,
      refreshSuggestions,
      updateEnergy,
      skipSuggestion
    }
  };
};
