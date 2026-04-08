import React from 'react';
import { EnergyLevel } from '@/entities/task';
import { Check } from 'lucide-react';
import { cn, vibrate } from '@/shared/lib/utils';

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
import { Separator } from '@/shared/ui/ui/separator';

export const EnergyPicker: React.FC<EnergyPickerProps> = ({ energy, onChange }) => {
    const getEnergyMeta = (level: EnergyLevel) => {
        switch(level) {
            case 'Low': return { color: 'bg-emerald-500', label: 'Low Energy' };
            case 'Medium': return { color: 'bg-yellow-500', label: 'Medium Energy' };
            case 'High': return { color: 'bg-orange-500', label: 'High Energy' };
        }
    };
    
    return (
        <div className="w-44 flex flex-col">
            <div className="px-2 py-1.5">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1 mb-1">Set Energy</div>
            </div>
            <Separator />
            <div className="p-1">
                {(['Low', 'Medium', 'High'] as EnergyLevel[]).map((lvl) => {
                    const meta = getEnergyMeta(lvl);
                    const isSelected = energy === lvl;
                    return (
                        <button
                            key={lvl}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(lvl);
                                vibrate('light');
                            }}
                            className={cn(
                                "flex items-center w-full gap-2 px-2 py-1.5 rounded-sm text-sm transition-all hover:bg-accent hover:text-accent-foreground active:scale-95",
                                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none",
                                isSelected ? "bg-accent text-accent-foreground" : "text-foreground"
                            )}
                            aria-pressed={isSelected}
                        >
                            <div className={cn(
                                "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                            )}>
                                <Check className="h-3 w-3" />
                            </div>
                            <span className={cn("w-2 h-2 rounded-full shrink-0", meta.color)}></span>
                            <span className="flex-1 text-left text-xs truncate">{meta.label}</span>
                        </button>
                    );
                })}
            </div>
            {energy && (
                <>
                    <Separator />
                    <div className="p-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                // Reset to default or handle clear
                                onChange('Medium');
                            }}
                            className="flex items-center justify-center w-full px-2 py-1.5 text-xs hover:bg-accent rounded-sm transition-colors"
                        >
                            Clear selection
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
