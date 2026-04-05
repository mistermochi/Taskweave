'use client';

import React from 'react';
import { cn } from '@/shared/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/ui/tooltip';
import { useIsMobile } from '@/shared/hooks/use-mobile';

interface HeatmapDay {
  date: string;
  slots: number[]; // 6 slots of 4 hours each
}

interface TaskCompletionHeatmapProps {
  data: HeatmapDay[];
}

const TIME_SLOTS = ['0', '4', '8', '12', '16', '20'];
const THRESHOLDS = [
  { max: 3600, color: 'bg-primary/20' },    // < 1h
  { max: 7200, color: 'bg-primary/40' },    // 1-2h
  { max: 10800, color: 'bg-primary/60' },   // 2-3h
  { max: 14400, color: 'bg-primary/80' },   // 3-4h
  { max: Infinity, color: 'bg-primary' },   // 4h+
];

const getColor = (seconds: number) => {
  if (seconds === 0) return 'bg-transparent';
  for (const threshold of THRESHOLDS) {
    if (seconds < threshold.max) return threshold.color;
  }
  return 'bg-primary';
};

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const TaskCompletionHeatmap: React.FC<TaskCompletionHeatmapProps> = ({ data }) => {
  const isMobile = useIsMobile();
  const displayDays = isMobile ? data.slice(-14) : data;

  return (
    <div className="w-full space-y-4">
      <div className="flex">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between pr-2 pb-6 pt-1">
          {TIME_SLOTS.map((slot) => (
            <span key={slot} className="text-[10px] text-zinc-400 font-medium h-3 flex items-center justify-end">
              {slot}
            </span>
          ))}
        </div>

        <div className="flex-1 overflow-x-auto no-scrollbar">
          <div className="flex flex-col gap-1">
            <TooltipProvider>
              <div className="flex gap-1">
                {displayDays.map((day, dayIdx) => (
                  <div key={day.date} className="flex flex-col gap-1">
                    {day.slots.map((seconds, slotIdx) => (
                      <Tooltip key={`${day.date}-${slotIdx}`}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "w-3 h-3 rounded-[2px] border border-zinc-100 dark:border-zinc-800/50 transition-colors",
                              getColor(seconds)
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <div className="font-bold">{new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          <div className="text-zinc-400">{TIME_SLOTS[slotIdx]}:00 - {parseInt(TIME_SLOTS[slotIdx]) + 4}:00</div>
                          <div className="mt-1 text-primary font-medium">{formatDuration(seconds)}</div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </div>
            </TooltipProvider>

            {/* X-axis labels */}
            <div className="flex gap-1 mt-1">
              {displayDays.map((day, idx) => {
                const date = new Date(day.date);
                const shouldShowLabel = idx % 5 === 0;

                return (
                  <div key={day.date} className="w-3 shrink-0 flex justify-center">
                    {shouldShowLabel && (
                      <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap transform -translate-x-1/2">
                        {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 px-2">
        <span className="text-[10px] text-zinc-400">Less</span>
        <div className="flex gap-1">
           <div className="w-2.5 h-2.5 rounded-[2px] border border-zinc-100 dark:border-zinc-800/50" />
           {THRESHOLDS.map((t, i) => (
             <div key={i} className={cn("w-2.5 h-2.5 rounded-[2px]", t.color)} />
           ))}
        </div>
        <span className="text-[10px] text-zinc-400">More</span>
      </div>
    </div>
  );
};
