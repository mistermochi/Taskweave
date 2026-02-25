import React from 'react';

/**
 * A circular progress indicator that visualizes the user's biological readiness score.
 * It changes color dynamically based on the score threshold (Red for low, Yellow for medium, Green for high).
 *
 * @component
 * @param {number} score - The readiness score from 0 to 100.
 */
export const ReadinessRing = ({ score }: { score: number }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let colorClass = 'text-primary';
  if (score < 40) colorClass = 'text-red-400';
  else if (score < 70) colorClass = 'text-yellow-400';

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r={radius} className="text-white/5" stroke="currentColor" strokeWidth="4" fill="transparent" />
            <circle
                cx="22" cy="22" r={radius}
                className={`transition-all duration-1000 ease-out ${colorClass}`}
                stroke="currentColor" strokeWidth="4" fill="transparent"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
            />
        </svg>
        <div className="absolute flex items-center justify-center">
            <span className="text-xxs font-bold text-foreground tabular-nums">{Math.round(score)}</span>
        </div>
    </div>
  );
};
