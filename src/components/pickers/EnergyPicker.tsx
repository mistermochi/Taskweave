import React from 'react';
import { EnergyLevel } from '@/entities/task';
import { Check } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

/**
 * Interface for EnergyPicker props.
 */
interface EnergyPickerProps {
    /** The currently selected energy level. */
    energy: EnergyLevel;
    /** Callback triggered when the energy level is updated. */
    onChange: (e: EnergyLevel) => void;
}

/**
 * UI component for selecting the required biological energy for a task.
 * Displays qualitative options (Low, Medium, High) with corresponding color indicators.
 * Uses shadcn-aligned patterns for a modern metadata selection experience.
 *
 * @component
 */
export const EnergyPicker: React.FC<EnergyPickerProps> = ({ energy, onChange }) => {
    const getEnergyMeta = (level: EnergyLevel) => {
        switch(level) {
            case 'Low': return { color: 'bg-emerald-500' };
            case 'Medium': return { color: 'bg-yellow-500' };
            case 'High': return { color: 'bg-orange-500' };
        }
    };
    
    return (
        <div className="w-32 space-y-2">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">Set Energy</div>
            <div className="flex flex-col gap-1">
                {(['Low', 'Medium', 'High'] as EnergyLevel[]).map((lvl) => (
                    <button
                        key={lvl}
                        onClick={(e) => { e.stopPropagation(); onChange(lvl); }}
                        className={cn(
                            "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-accent",
                            energy === lvl ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                        )}
                    >
                        <span className={cn("w-2 h-2 rounded-full shrink-0", getEnergyMeta(lvl).color)}></span>
                        <span className="flex-1 text-left">{lvl}</span>
                        {energy === lvl && <Check size={12} className="shrink-0" />}
                    </button>
                ))}
            </div>
        </div>
    );
};
