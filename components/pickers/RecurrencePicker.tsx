
'use client';

import React, { useState, useEffect } from 'react';
import { RecurrenceConfig, RecurrenceFrequency } from '@/types';
import { ChevronDown, Check } from 'lucide-react';
import { formatRecurrence } from '@/utils/timeUtils';
import { PickerContainer } from './PickerContainer';

interface RecurrencePickerProps {
  value: RecurrenceConfig | undefined;
  onChange: (config: RecurrenceConfig | undefined) => void;
  baseDate?: Date; // To show "Monthly on day 27" context
  standalone?: boolean; // If true, renders the UI directly without the trigger button
}

export const RecurrencePicker: React.FC<RecurrencePickerProps> = ({ 
    value, 
    onChange, 
    baseDate = new Date(),
    standalone = false 
}) => {
  const [isOpen, setIsOpen] = useState(standalone);
  
  // Internal state for editing (mirrors RecurrenceConfig structure)
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [interval, setInterval] = useState(1);
  const [weekDays, setWeekDays] = useState<number[]>([]);
  const [monthlyType, setMonthlyType] = useState<'date' | 'relative'>('date');
  const [weekOfMonth, setWeekOfMonth] = useState<number>(1); // 1-5
  const [dayOfWeek, setDayOfWeek] = useState<number>(1); // For Monthly Relative

  // Sync internal state when value changes
  useEffect(() => {
    if (value) {
      setFrequency(value.frequency);
      setInterval(value.interval);
      if (value.weekDays) setWeekDays(value.weekDays);
      if (value.monthlyType) setMonthlyType(value.monthlyType);
      if (value.weekOfMonth) setWeekOfMonth(value.weekOfMonth);
      if (value.weekDays && value.weekDays.length > 0) setDayOfWeek(value.weekDays[0]);
    } else {
      // Defaults based on baseDate
      setWeekDays([baseDate.getDay()]);
      setDayOfWeek(baseDate.getDay());
      const nth = Math.ceil(baseDate.getDate() / 7);
      setWeekOfMonth(nth > 4 ? 5 : nth);
    }
  }, [value, baseDate]);

  const commitChange = (override?: Partial<RecurrenceConfig>) => {
    const config: RecurrenceConfig = {
      frequency,
      interval,
      ...(override || {})
    };

    if (config.frequency === 'weekly') {
        config.weekDays = override?.weekDays ?? weekDays;
    }

    if (config.frequency === 'monthly') {
      config.monthlyType = monthlyType;
      if (monthlyType === 'relative') {
        config.weekOfMonth = weekOfMonth;
        config.weekDays = [dayOfWeek]; 
      }
    }
    
    const finalConfig = { ...config, ...override };

    // A weekly recurrence with no selected days is not a valid recurrence.
    // Instead of setting it to undefined here (which causes a state loop),
    // we pass the invalid config up. The parent (TaskRow) will interpret it on save.
    onChange(finalConfig);
  };

  const toggleWeekDay = (day: number) => {
    const newDays = weekDays.includes(day) 
      ? weekDays.filter(d => d !== day) 
      : [...weekDays, day];
    
    newDays.sort((a,b) => a - b);
    setWeekDays(newDays);
    
    commitChange({ weekDays: newDays });
  };

  const getRecurrenceSummary = () => {
    return formatRecurrence(value, baseDate);
  };

  if (!isOpen && !standalone) {
    return (
        <button 
           onClick={() => setIsOpen(true)}
           className={`w-full py-2 rounded-lg text-xxs font-bold uppercase transition-colors flex items-center justify-center gap-2 ${value ? 'bg-primary/10 text-primary' : 'bg-foreground/5 text-secondary hover:text-foreground'}`}
        >
            <div className="flex items-center gap-2">
                {value ? <Check size={12} /> : null}
                <span>{getRecurrenceSummary()}</span>
            </div>
            {value && <div onClick={(e) => { e.stopPropagation(); onChange(undefined); }} className="p-1 hover:text-red-400"><div className="w-3 h-3 bg-current rounded-full opacity-30 hover:opacity-100 flex items-center justify-center text-xxs text-black"></div></div>}
        </button>
    );
  }

  const pickerContent = (
    <div className="flex flex-col gap-3">
       {/* Frequency & Interval */}
       <div className="flex gap-2">
          <div className="flex-[0.8]">
             <div className="relative">
                <input 
                    type="number" 
                    min="1" 
                    max="99" 
                    value={interval}
                    onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setInterval(val);
                        commitChange({ interval: val });
                    }}
                    className="w-full bg-foreground/5 border border-border rounded-lg px-2 py-1.5 text-foreground text-xs text-center focus:border-primary/50 outline-none"
                    aria-label="Recurrence interval"
                />
             </div>
          </div>
          <div className="flex-[2] relative">
              <select 
                value={frequency}
                onChange={(e) => {
                   const freq = e.target.value as RecurrenceFrequency;
                  setFrequency(freq);
                  if (freq === 'weekly') {
                      commitChange({ frequency: freq, weekDays: [baseDate.getDay()] });
                  } else if (freq === 'monthly') {
                      commitChange({ frequency: freq, monthlyType: 'date' });
                  } else {
                      commitChange({ frequency: freq });
                  }
               }}
               className="w-full bg-foreground/5 border border-border rounded-lg px-2 py-1.5 text-foreground text-xs appearance-none focus:border-primary/50 outline-none cursor-pointer"
             >
                <option value="daily">day{interval > 1 ? 's' : ''}</option>
                <option value="weekly">week{interval > 1 ? 's' : ''}</option>
                <option value="monthly">month{interval > 1 ? 's' : ''}</option>
                <option value="yearly">year{interval > 1 ? 's' : ''}</option>
             </select>
             <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
          </div>
       </div>

       {/* Weekly Specifics */}
       {frequency === 'weekly' && (
         <div className="flex justify-between">
            {['S','M','T','W','T','F','S'].map((label, idx) => {
                const isActive = weekDays.includes(idx);
                const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][idx];
                return (
                    <button
                      key={idx}
                      onClick={() => toggleWeekDay(idx)}
                      aria-label={dayName}
                      className={`h-6 w-6 rounded-md text-xxs font-bold flex items-center justify-center transition-all ${isActive ? 'bg-primary text-primary-foreground' : 'bg-foreground/5 text-secondary hover:bg-foreground/10'}`}
                    >
                        {label}
                    </button>
                );
            })}
         </div>
       )}

       {/* Monthly Specifics */}
       {frequency === 'monthly' && (
         <div className="flex flex-col gap-1.5">
            <button 
                onClick={() => {
                    setMonthlyType('date');
                    commitChange({ monthlyType: 'date' });
                }}
                className={`flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${monthlyType === 'date' ? 'bg-foreground/10' : 'hover:bg-foreground/5'}`}
            >
                <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${monthlyType === 'date' ? 'border-primary' : 'border-secondary'}`}>
                    {monthlyType === 'date' && <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>}
                </div>
                <span className="text-xs text-foreground">Day {baseDate.getDate()} monthly</span>
            </button>
            
            <button 
                onClick={() => {
                    setMonthlyType('relative');
                    const nth = Math.ceil(baseDate.getDate() / 7);
                    const safeNth = nth > 4 ? 5 : nth;
                    setWeekOfMonth(safeNth);
                    setDayOfWeek(baseDate.getDay());
                    commitChange({ monthlyType: 'relative', weekOfMonth: safeNth, weekDays: [baseDate.getDay()] });
                }}
                className={`flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${monthlyType === 'relative' ? 'bg-foreground/10' : 'hover:bg-foreground/5'}`}
            >
                <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${monthlyType === 'relative' ? 'border-primary' : 'border-secondary'}`}>
                    {monthlyType === 'relative' && <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>}
                </div>
                
                {monthlyType === 'relative' ? (
                     <div className="flex gap-1">
                        <select 
                            value={weekOfMonth}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setWeekOfMonth(val);
                                commitChange({ monthlyType: 'relative', weekOfMonth: val });
                            }}
                            className="bg-transparent text-xs text-foreground font-medium outline-none border-b border-border pb-0.5 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <option value={1}>1st</option>
                            <option value={2}>2nd</option>
                            <option value={3}>3rd</option>
                            <option value={4}>4th</option>
                            <option value={5}>Last</option>
                        </select>
                        <select 
                            value={dayOfWeek}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setDayOfWeek(val);
                                commitChange({ monthlyType: 'relative', weekDays: [val] });
                            }}
                            className="bg-transparent text-xs text-foreground font-medium outline-none border-b border-border pb-0.5 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => (
                                <option key={i} value={i}>{d}</option>
                            ))}
                        </select>
                     </div>
                ) : (
                    <span className="text-xs text-secondary">Relative (e.g. 2nd Mon)</span>
                )}
            </button>
         </div>
       )}
    </div>
  );

  if (standalone) {
    return (
        <PickerContainer
            title="Recurrence"
            onClear={value ? () => onChange(undefined) : undefined}
            className="w-56"
        >
            {pickerContent}
        </PickerContainer>
    );
  }

  return (
    <div className={'bg-surface-highlight border border-border rounded-xl p-4 mt-2 animate-fade-in relative z-20'}>
       <div className="flex justify-between items-center mb-4">
          <span className="text-xxs font-bold text-secondary uppercase tracking-wider">Recurrence</span>
          <button onClick={() => setIsOpen(false)} className="text-xs text-primary font-bold hover:underline">Done</button>
       </div>
       {pickerContent}
    </div>
  );
};
