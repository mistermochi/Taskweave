"use client";

import React from 'react';
import { cn } from "@/shared/lib/utils";

/**
 * A circular progress indicator that visualizes the user's biological readiness score.
 * It changes color dynamically based on the score threshold (Red for low, Yellow for medium, Green for high).
 *
 * @component
 * @param {number} score - The readiness score from 0 to 100.
 */
export const ReadinessRing = ({ score, className }: { score: number; className?: string }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let colorClass = 'text-primary';
  if (score < 40) colorClass = 'text-destructive';
  else if (score < 70) colorClass = 'text-orange-500';

  return (
    <div
      className={cn("relative w-12 h-12 flex items-center justify-center", className)}
      role="progressbar"
      aria-valuenow={Math.round(score)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Biological readiness score"
    >
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 44 44" aria-hidden="true">
            <circle cx="22" cy="22" r={radius} className="text-muted/50" stroke="currentColor" strokeWidth="4" fill="transparent" />
            <circle
                cx="22" cy="22" r={radius}
                className={cn("transition-all duration-1000 ease-out", colorClass)}
                stroke="currentColor" strokeWidth="4" fill="transparent"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
            />
        </svg>
        <div className="absolute flex items-center justify-center">
            <span className="text-[10px] font-bold text-foreground tabular-nums">{Math.round(score)}</span>
        </div>
    </div>
  );
};
