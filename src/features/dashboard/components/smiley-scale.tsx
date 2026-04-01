"use client";

import React from 'react';
import { Angry, Frown, Meh, Smile, Laugh } from 'lucide-react';
import { cn, vibrate } from "@/shared/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/ui/tooltip";

/**
 * Interface for SmileyScale props.
 */
interface SmileyScaleProps {
  /** The currently selected mood level (1-5). */
  value: number;
  /** Callback triggered when a new level is selected. */
  onChange: (val: number) => void;
  className?: string;
}

/**
 * A qualitative 5-point scale for tracking user mood/energy.
 * It uses descriptive icons from Angry to Laughing to capture the user's state.
 *
 * @component
 */
export const SmileyScale = ({ value, onChange, className }: SmileyScaleProps) => {
  const steps = [
    { level: 1, icon: Angry, color: 'text-destructive', label: 'Drained' },
    { level: 2, icon: Frown, color: 'text-orange-500', label: 'Low' },
    { level: 3, icon: Meh, color: 'text-yellow-500', label: 'Neutral' },
    { level: 4, icon: Smile, color: 'text-emerald-500', label: 'Good' },
    { level: 5, icon: Laugh, color: 'text-primary', label: 'Great' },
  ];

  return (
    <div className={cn("flex justify-between items-center w-full px-1 py-2", className)}>
      {steps.map((step) => {
        const isActive = value === step.level;
        const Icon = step.icon;
        return (
          <Tooltip key={step.level}>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  onChange(step.level);
                  vibrate('light');
                }}
                aria-pressed={isActive}
                className={cn(
                  "group flex flex-col items-center justify-center p-1 rounded-full transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive ? "scale-110" : "opacity-40 hover:opacity-80"
                )}
                type="button"
              >
                <Icon
                  size={24}
                  className={cn(
                    "transition-colors duration-300",
                    isActive ? step.color : "text-muted-foreground"
                  )}
                />
                <span className="sr-only">{step.label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {step.label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
};
