import React from 'react';
import { Minus, Plus, Timer } from 'lucide-react';
import { Button } from '@/shared/ui/ui/button';
import { cn } from '@/shared/lib/utils';

/**
 * Interface for DurationPicker props.
 */
interface DurationPickerProps {
    /** The currently selected duration in minutes. */
    duration: number;
    /** Callback triggered when the duration is updated. */
    onChange: (d: number) => void;
}

/**
 * UI component for selecting task duration.
 * Provides fine-grained adjustment (increment/decrement) and common preset buttons.
 * Uses shadcn patterns for buttons and layout.
 *
 * @component
 */
export const DurationPicker: React.FC<DurationPickerProps> = ({ duration, onChange }) => (
    <div className="w-48 space-y-3">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">Set Duration</div>

        <div className="flex flex-col gap-2">
            {/* Step Controls */}
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-1 border border-border/50">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md"
                    onClick={(e) => { e.stopPropagation(); onChange(Math.max(5, duration - 5)); }}
                >
                    <Minus size={14} />
                </Button>
                <div className="flex items-center gap-1.5">
                    <Timer size={14} className="text-muted-foreground" />
                    <span className="text-sm font-bold tabular-nums">{duration}m</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md"
                    onClick={(e) => { e.stopPropagation(); onChange(Math.min(240, duration + 5)); }}
                >
                    <Plus size={14} />
                </Button>
            </div>

            {/* Common Presets */}
            <div className="grid grid-cols-3 gap-1.5">
                {[5, 15, 30, 45, 60, 90].map(m => (
                    <Button
                        key={m}
                        variant={duration === m ? "default" : "outline"}
                        className={cn(
                            "h-8 text-[10px] font-bold p-0",
                            duration !== m && "bg-muted/30 border-none shadow-none text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                        onClick={(e) => { e.stopPropagation(); onChange(m); }}
                    >
                        {m}m
                    </Button>
                ))}
            </div>
        </div>
    </div>
);
