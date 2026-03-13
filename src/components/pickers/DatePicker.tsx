'use client';

import React from 'react';
import { addDays, nextSaturday } from 'date-fns';
import { Calendar } from '@/shared/ui/ui/calendar';
import { Button } from '@/shared/ui/ui/button';
import { cn } from '@/shared/lib/utils';
import { Calendar as CalendarIcon, X } from 'lucide-react';

/**
 * Interface for DatePicker props.
 */
interface DatePickerProps {
  /** The currently selected timestamp. */
  value: number | undefined;
  /** Callback triggered when the date is updated. */
  onChange: (ts: number | undefined) => void;
  /** Whether this is a deadline (due) or a scheduled (assigned) date. */
  type: 'due' | 'assigned';
}

/**
 * A specialized date selection component for tasks.
 * It provides quick-select buttons for common offsets (Today, Tomorrow, Weekend, Next Week)
 * and a standard shadcn Calendar for custom selection.
 *
 * @component
 */
export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, type }) => {
  const today = new Date();

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(undefined);
      return;
    }
    // Set consistent time based on type
    const d = new Date(date);
    d.setHours(type === 'due' ? 23 : 12, type === 'due' ? 59 : 0, 0, 0);
    onChange(d.getTime());
  };

  const setQuick = (date: Date) => {
    const d = new Date(date);
    d.setHours(type === 'due' ? 23 : 12, type === 'due' ? 59 : 0, 0, 0);
    onChange(d.getTime());
  };

  return (
    <div className="flex flex-col w-[260px]">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
            <CalendarIcon size={14} className="text-muted-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {type === 'due' ? 'Set Deadline' : 'Set Schedule'}
            </span>
        </div>
        {value && (
            <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-sm hover:text-destructive"
                onClick={() => onChange(undefined)}
            >
                <X size={12} />
            </Button>
        )}
      </div>

      <div className="flex flex-row items-stretch">
        <div className="flex-1 p-1">
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={handleSelect}
            initialFocus
            className="p-0"
          />
        </div>
        <div className="w-[64px] border-l bg-muted/20 flex flex-col gap-0.5 p-1 pt-2">
            {[
                { label: 'Today', date: today },
                { label: 'Tmw', date: addDays(today, 1) },
                { label: 'Wknd', date: nextSaturday(today) },
                { label: 'Next', date: addDays(today, 7) }
            ].map((preset) => (
                <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="justify-center font-bold text-[9px] h-7 px-0 uppercase tracking-tighter hover:bg-accent"
                    onClick={() => setQuick(preset.date)}
                >
                    {preset.label}
                </Button>
            ))}
        </div>
      </div>
    </div>
  );
};
