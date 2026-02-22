import { useState, useEffect, useCallback, useMemo } from 'react';
import { Suggestion, SuggestionContext } from '@/types/scheduling';
import { LocalSchedulingEngine } from '@/services/LocalSchedulingEngine';
import { AIService } from '@/services/AIService';
import { LearningEngine } from '@/services/LearningEngine';
import { ContextService } from '@/services/ContextService';
import { ViewName, NavigationHandler } from '@/types';
import { useTaskContext } from '@/context/TaskContext';
import { useReferenceContext } from '@/context/ReferenceContext';
import { useNavigation } from '@/context/NavigationContext';

export const useSchedulingController = (onNavigate?: NavigationHandler) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEnergy, setCurrentEnergy] = useState(75);
  const [error, setError] = useState<string | null>(null);

  const localEngine = useMemo(() => LocalSchedulingEngine.getInstance(), []);
  const learningEngine = useMemo(() => new LearningEngine(), []);
  const aiService = useMemo(() => new AIService(), []);
  const contextService = ContextService.getInstance();
  const { focusOnTask } = useNavigation();
  
  const { tasks: allTasks } = useTaskContext();
  const { tags } = useReferenceContext();

  const activeTasks = useMemo(() => 
    allTasks.filter(t => t.status === 'active'),
  [allTasks]);

  const completedTasks = useMemo(() => 
    allTasks.filter(t => t.status === 'completed'),
  [allTasks]);
  
  const backlogCount = activeTasks.length;
  const userEnergy = currentEnergy;

  const generateSuggestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const currentTime = new Date();
      const availableMinutes = 120;
      const userContext = await contextService.getSnapshot();
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
  }, [activeTasks, completedTasks, backlogCount, userEnergy, learningEngine, localEngine, contextService, tags]);

  useEffect(() => {
    if (activeTasks.length > 0) {
      generateSuggestions();
    }
  }, [activeTasks, backlogCount, userEnergy, generateSuggestions]);

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

  const skipSuggestion = useCallback(() => {
    if (suggestions.length > 0) {
      setSuggestions(suggestions.slice(1));
    }
  }, [suggestions]);

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
