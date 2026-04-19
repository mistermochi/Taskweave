'use client';

import React, { useState, useEffect } from 'react';
import { RecurrenceConfig, RecurrenceFrequency } from '@/entities/task';
import { ChevronDown, Check, Repeat, X } from 'lucide-react';
import { formatRecurrence } from '@/shared/lib/timeUtils';
import { cn, vibrate } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/ui/button';
import { Input } from '@/shared/ui/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/shared/ui/ui/select';

/**
 * Interface for RecurrencePicker props.
 */
interface RecurrencePickerProps {
  /** Current recurrence configuration. */
  value: RecurrenceConfig | undefined;
  /** Callback triggered when the configuration is updated. */
  onChange: (config: RecurrenceConfig | undefined) => void;
  /** Anchor date for relative calculations (e.g. "Every 2nd Tuesday"). */
  baseDate?: Date;
  /** Whether to render the full UI immediately without a trigger button. */
  standalone?: boolean;
}

/**
 * Complex UI component for configuring recurring task rules.
 * Supports daily, weekly (multi-day), and monthly (date-based or relative) frequencies.
 * Uses shadcn Select, Input, and Button components for a modern look.
 *
 * @component
 */
export const RecurrencePicker: React.FC<RecurrencePickerProps> = ({ 
    value, 
    onChange, 
    baseDate = new Date(),
    standalone = false 
}) => {
  const [isOpen, setIsOpen] = useState(standalone);
  
  // Internal state for editing
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('weekly');
  const [interval, setInterval] = useState(1);
  const [weekDays, setWeekDays] = useState<number[]>([]);
  const [monthlyType, setMonthlyType] = useState<'date' | 'relative'>('date');
  const [weekOfMonth, setWeekOfMonth] = useState<number>(1);
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);

  useEffect(() => {
    if (value) {
      setFrequency(value.frequency);
      setInterval(value.interval);
      if (value.weekDays) setWeekDays(value.weekDays);
      if (value.monthlyType) setMonthlyType(value.monthlyType);
      if (value.weekOfMonth) setWeekOfMonth(value.weekOfMonth);
      if (value.weekDays && value.weekDays.length > 0) setDayOfWeek(value.weekDays[0]);
    } else {
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
    
    onChange({ ...config, ...override });
  };

  const toggleWeekDay = (day: number) => {
    const newDays = weekDays.includes(day) 
      ? weekDays.filter(d => d !== day) 
      : [...weekDays, day];
    
    newDays.sort((a,b) => a - b);
    setWeekDays(newDays);
    commitChange({ weekDays: newDays });
    vibrate('light');
  };

  const pickerContent = (
    <div className="flex flex-col gap-4">
       {/* Frequency & Interval */}
       <div className="flex items-center gap-2">
          <Input
            type="number"
            min="1"
            max="99"
            value={interval}
            onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setInterval(val);
                commitChange({ interval: val });
            }}
            className="w-14 h-9 text-center bg-muted/30 border-none shadow-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Select
            value={frequency}
            onValueChange={(val: RecurrenceFrequency) => {
                setFrequency(val);
                if (val === 'weekly') commitChange({ frequency: val, weekDays: [baseDate.getDay()] });
                else if (val === 'monthly') commitChange({ frequency: val, monthlyType: 'date' });
                else commitChange({ frequency: val });
                vibrate('light');
            }}
          >
            <SelectTrigger className="flex-1 h-9 bg-muted/30 border-none shadow-none focus:ring-1 focus:ring-ring">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="daily">day{interval > 1 ? 's' : ''}</SelectItem>
                <SelectItem value="weekly">week{interval > 1 ? 's' : ''}</SelectItem>
                <SelectItem value="monthly">month{interval > 1 ? 's' : ''}</SelectItem>
                <SelectItem value="yearly">year{interval > 1 ? 's' : ''}</SelectItem>
            </SelectContent>
          </Select>
       </div>

       {/* Weekly Specifics */}
       {frequency === 'weekly' && (
         <div className="flex justify-between gap-1">
            {['S','M','T','W','T','F','S'].map((label, idx) => {
                const isSelected = weekDays.includes(idx);
                return (
                    <Button
                        key={idx}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                            "h-7 w-7 p-0 text-[10px] font-bold transition-all active:scale-95",
                            !isSelected && "bg-muted/30 border-none shadow-none text-muted-foreground hover:bg-accent"
                        )}
                        onClick={() => toggleWeekDay(idx)}
                        aria-pressed={isSelected}
                    >
                        {label}
                    </Button>
                );
            })}
         </div>
       )}

       {/* Monthly Specifics */}
       {frequency === 'monthly' && (
         <div className="space-y-2">
            <Button
                variant="ghost"
                className={cn(
                    "w-full justify-start gap-3 h-9 text-xs transition-all active:scale-95",
                    monthlyType === 'date' ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
                onClick={() => {
                    setMonthlyType('date');
                    commitChange({ monthlyType: 'date' });
                    vibrate('light');
                }}
                aria-pressed={monthlyType === 'date'}
            >
                <div className={cn(
                    "w-3 h-3 rounded-full border flex items-center justify-center shrink-0",
                    monthlyType === 'date' ? "border-primary" : "border-muted-foreground"
                )}>
                    {monthlyType === 'date' && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </div>
                <span>Day {baseDate.getDate()} of every month</span>
            </Button>

            <div
                className={cn(
                    "flex items-center w-full gap-3 p-2 rounded-md transition-all text-left",
                    monthlyType === 'relative' ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50"
                )}
            >
                <button
                    type="button"
                    className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-full shrink-0"
                    onClick={() => {
                        setMonthlyType('relative');
                        const nth = Math.ceil(baseDate.getDate() / 7);
                        const safeNth = nth > 4 ? 5 : nth;
                        setWeekOfMonth(safeNth);
                        setDayOfWeek(baseDate.getDay());
                        commitChange({ monthlyType: 'relative', weekOfMonth: safeNth, weekDays: [baseDate.getDay()] });
                        vibrate('light');
                    }}
                    aria-label="Select relative monthly recurrence"
                    aria-pressed={monthlyType === 'relative'}
                >
                    <div className={cn(
                        "w-3 h-3 rounded-full border flex items-center justify-center shrink-0",
                        monthlyType === 'relative' ? "border-primary" : "border-muted-foreground"
                    )}>
                        {monthlyType === 'relative' && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </div>
                </button>
                
                <div className="flex gap-1.5 flex-1 min-w-0">
                    <Select
                        value={String(weekOfMonth)}
                        onValueChange={(val) => {
                            setMonthlyType('relative');
                            const v = parseInt(val);
                            setWeekOfMonth(v);
                            commitChange({ monthlyType: 'relative', weekOfMonth: v });
                            vibrate('light');
                        }}
                    >
                        <SelectTrigger className="h-7 bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold w-fit gap-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">1st</SelectItem>
                            <SelectItem value="2">2nd</SelectItem>
                            <SelectItem value="3">3rd</SelectItem>
                            <SelectItem value="4">4th</SelectItem>
                            <SelectItem value="5">Last</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={String(dayOfWeek)}
                        onValueChange={(val) => {
                            setMonthlyType('relative');
                            const v = parseInt(val);
                            setDayOfWeek(v);
                            commitChange({ monthlyType: 'relative', weekDays: [v] });
                            vibrate('light');
                        }}
                    >
                        <SelectTrigger className="h-7 bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold w-fit gap-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d, i) => (
                                <SelectItem key={i} value={String(i)}>{d.slice(0, 3)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
         </div>
       )}
    </div>
  );

  return (
    <div className="w-56 space-y-3">
        <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
                <Repeat size={14} className="text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recurrence</span>
            </div>
            {value && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-sm hover:text-destructive"
                    onClick={() => {
                        onChange(undefined);
                        vibrate('light');
                    }}
                    aria-label="Clear recurrence"
                >
                    <X size={12} />
                </Button>
            )}
        </div>
        {pickerContent}
    </div>
  );
};
