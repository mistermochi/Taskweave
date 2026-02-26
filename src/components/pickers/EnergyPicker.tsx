import React from 'react';
import { EnergyLevel } from '../../types';
import { Check } from 'lucide-react';
import { PickerContainer } from './PickerContainer';

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
 *
 * @component
 */
export const EnergyPicker: React.FC<EnergyPickerProps> = ({ energy, onChange }) => {
    const getEnergyMeta = (level: EnergyLevel) => {
        switch(level) {
            case 'Low': return { color: 'text-emerald-400' };
            case 'Medium': return { color: 'text-yellow-400' };
            case 'High': return { color: 'text-orange-400' };
        }
    };
    
    return (
        <PickerContainer title="Set Energy" className="w-32">
            <div className="flex flex-col gap-1">
                {(['Low', 'Medium', 'High'] as EnergyLevel[]).map((lvl) => (
                    <button
                        key={lvl}
                        onClick={(e) => { e.stopPropagation(); onChange(lvl); }}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xxs font-bold transition-colors hover:bg-foreground/10 ${energy === lvl ? 'bg-foreground/10 text-foreground' : 'text-secondary'}`}
                    >
                        <span className={`w-2 h-2 rounded-full ${getEnergyMeta(lvl).color} bg-current`}></span>
                        <span>{lvl}</span>
                        {energy === lvl && <Check size={10} className="ml-auto" />}
                    </button>
                ))}
            </div>
        </PickerContainer>
    );
};
