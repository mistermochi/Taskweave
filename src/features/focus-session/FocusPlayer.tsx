'use client';

import React from 'react';
import { Play, Pause, Check, ChevronUp } from 'lucide-react';
import { useFocusSessionController } from '@/hooks/controllers/useFocusSessionController';
import { useNavigation } from '@/context/NavigationContext';
import { Button } from '@/shared/ui/ui/button';
import { Progress } from '@/shared/ui/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/ui/tooltip';

/**
 * The "Now Playing" interface for an active task.
 * It remains docked at the bottom of the viewport while a task is in focus.
 */
export const FocusPlayer: React.FC = () => {
  const { activeTaskId, toggleFocusExpansion } = useNavigation();
  const { state, actions } = useFocusSessionController(activeTaskId);

  if (!state.task) return null;

  const totalDurationSeconds = (state.task.duration || 1) * 60;
  const progress = Math.min(100, Math.max(0, (1 - (state.timeLeft / totalDurationSeconds)) * 100));

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border h-20 flex flex-col animate-in slide-in-from-bottom-full duration-300">
      <Progress value={progress} className="h-1 rounded-none bg-transparent" />

      <div className="flex-1 flex items-center px-4 md:px-6 justify-between max-w-screen-2xl mx-auto w-full">
        {/* Left: Task Info */}
        <div
          className="flex items-center gap-4 min-w-0 cursor-pointer group"
          onClick={toggleFocusExpansion}
        >
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
              {state.task.title}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {state.formattedTime} remaining
            </span>
          </div>
        </div>

        {/* Center: Controls */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={actions.toggleTimer}
              >
                {state.isActive ? (
                  <Pause className="h-6 w-6 fill-current" />
                ) : (
                  <Play className="h-6 w-6 fill-current ml-1" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{state.isActive ? 'Pause' : 'Resume'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-primary transition-colors"
                onClick={actions.completeSession}
              >
                <Check className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Complete Task</TooltipContent>
          </Tooltip>
        </div>

        {/* Right: Expand/Actions */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground"
                onClick={toggleFocusExpansion}
              >
                <ChevronUp className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Expand</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
