
import React from 'react';
import { Angry, Frown, Meh, Smile, Laugh } from 'lucide-react';

export const SmileyScale = ({ value, onChange }: { value: number; onChange: (val: number) => void }) => {
  const steps = [
    { level: 1, icon: Angry, color: 'text-red-400', label: 'Drained' },
    { level: 2, icon: Frown, color: 'text-orange-400', label: 'Low' },
    { level: 3, icon: Meh, color: 'text-yellow-400', label: 'Neutral' },
    { level: 4, icon: Smile, color: 'text-emerald-400', label: 'Good' },
    { level: 5, icon: Laugh, color: 'text-primary', label: 'Great' },
  ];

  return (
    <div className="flex justify-between items-center w-full px-1 py-2">
      {steps.map((step) => {
        const isActive = value === step.level;
        const Icon = step.icon;
        return (
          <button
            key={step.level}
            onClick={() => onChange(step.level)}
            className={`group flex flex-col items-center gap-1 transition-all duration-300 outline-none ${isActive ? 'scale-110' : 'opacity-40 hover:opacity-80'}`}
          >
            <Icon size={24} className={`transition-colors duration-300 ${isActive ? step.color : 'text-secondary'}`} />
          </button>
        );
      })}
    </div>
  );
};
