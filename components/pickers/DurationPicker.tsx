import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { PickerContainer } from './PickerContainer';

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
 *
 * @component
 */
export const DurationPicker: React.FC<DurationPickerProps> = ({ duration, onChange }) => (
    <PickerContainer title="Set Duration" className="w-48">
        <div className="flex flex-col gap-1">
            {/* Step Controls */}
            <div className="flex items-center justify-between bg-foreground/5 rounded-lg p-1">
                <button
                    onClick={(e) => { e.stopPropagation(); onChange(Math.max(5, duration - 5)); }}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-foreground/10 text-secondary hover:text-foreground"
                >
                    <Minus size={12} />
                </button>
                <span className="text-sm font-bold text-foreground tabular-nums">{duration}m</span>
                <button
                    onClick={(e) => { e.stopPropagation(); onChange(Math.min(240, duration + 5)); }}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-foreground/10 text-secondary hover:text-foreground"
                >
                    <Plus size={12} />
                </button>
            </div>
            {/* Common Presets */}
            <div className="grid grid-cols-3 gap-1">
                {[5, 15, 30, 45, 60, 90].map(m => (
                    <button
                        key={m}
                        onClick={(e) => { e.stopPropagation(); onChange(m); }}
                        className={`py-1.5 rounded-lg text-xxs font-bold transition-all ${duration === m ? 'bg-primary text-background' : 'bg-foreground/5 text-secondary hover:text-foreground hover:bg-foreground/10'}`}
                    >
                        {m}m
                    </button>
                ))}
            </div>
        </div>
    </PickerContainer>
);
