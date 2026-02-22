
import React from 'react';
import { Calendar } from 'lucide-react';
import { PickerContainer } from './PickerContainer';

interface DatePickerProps {
    value: number | undefined; 
    onChange: (ts: number | undefined) => void; 
    type: 'due' | 'assigned';
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, type }) => {
    const setQuick = (offsetDays: number, hour: number) => {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        d.setHours(hour, (type === 'due' ? 59 : 0), (type === 'due' ? 59 : 0), 0);
        onChange(d.getTime());
    };

    return (
        <PickerContainer
            title={type === 'due' ? 'Due Date' : 'Schedule Date'}
            onClear={value ? () => onChange(undefined) : undefined}
            className="w-48"
        >
            <div className="flex flex-col gap-1">
                <div className="grid grid-cols-2 gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setQuick(0, type === 'due' ? 23 : 12); }} className="py-1.5 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-xxs font-bold text-foreground transition-colors">Today</button>
                    <button onClick={(e) => { e.stopPropagation(); setQuick(1, type === 'due' ? 23 : 12); }} className="py-1.5 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-xxs font-bold text-foreground transition-colors">Tomorrow</button>
                    <button onClick={(e) => { e.stopPropagation(); setQuick(7, type === 'due' ? 23 : 12); }} className="py-1.5 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-xxs font-bold text-foreground transition-colors col-span-2">Next Week</button>
                </div>
                <div className="relative bg-foreground/5 rounded-lg p-1.5 flex items-center gap-2 hover:bg-foreground/10 transition-colors">
                    <Calendar size={12} className="text-secondary ml-1" />
                    <input 
                        type="date" 
                        className="bg-transparent border-none text-xxs text-foreground font-medium p-0 focus:ring-0 w-full cursor-pointer"
                        value={value ? new Date(value).toISOString().split('T')[0] : ''}
                        onChange={(e) => { e.stopPropagation(); if (e.target.valueAsNumber) { const d = new Date(e.target.value); d.setHours(type === 'due' ? 23 : 12, 0, 0); onChange(d.getTime()); } }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            </div>
        </PickerContainer>
    );
};
