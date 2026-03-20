import React from 'react';
import { EnergyLevel } from '@/entities/task';
import { Check } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Separator } from '@/shared/ui/ui/separator';
import { ENERGY_COLORS } from '@/entities/task/lib/colors';

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
    return (
        <div className="w-44 flex flex-col">
            <div className="px-2 py-1.5">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1 mb-1">Set Energy</div>
            </div>
            <Separator />
            <div className="p-1">
                {(['Low', 'Medium', 'High'] as EnergyLevel[]).map((lvl) => {
                    const meta = ENERGY_COLORS[lvl];
                    const isSelected = energy === lvl;
                    return (
                        <button
                            key={lvl}
                            onClick={(e) => { e.stopPropagation(); onChange(lvl); }}
                            className={cn(
                                "flex items-center w-full gap-2 px-2 py-1.5 rounded-sm text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                                isSelected ? "bg-accent text-accent-foreground" : "text-foreground"
                            )}
                        >
                            <div className={cn(
                                "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                            )}>
                                <Check className="h-3 w-3" />
                            </div>
                            <span className={cn("w-2 h-2 rounded-full shrink-0", meta.hex === '#10b981' ? 'bg-emerald-500' : meta.hex === '#f59e0b' ? 'bg-amber-500' : 'bg-orange-500')}></span>
                            <span className="flex-1 text-left text-xs truncate">{lvl} Energy</span>
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
