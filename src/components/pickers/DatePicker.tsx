'use client';

import React from 'react';
import { addDays } from 'date-fns';
import { Calendar } from '@/shared/ui/ui/calendar';
import { Button } from '@/shared/ui/ui/button';
import { CardContent, CardFooter } from '@/shared/ui/ui/card';
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
 * It provides quick-select buttons for common offsets (Today, Tomorrow, 3 days, Week, 2 Weeks)
 * and a standard shadcn Calendar for custom selection.
 *
 * @component
 */
export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, type }) => {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    value ? new Date(value) : new Date()
  );

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(undefined);
      return;
    }
    // Set consistent time based on type
    const d = new Date(date);
    d.setHours(type === 'due' ? 23 : 12, type === 'due' ? 59 : 0, 0, 0);
    onChange(d.getTime());
    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const setQuick = (days: number) => {
    const newDate = addDays(new Date(), days);
    const d = new Date(newDate);
    d.setHours(type === 'due' ? 23 : 12, type === 'due' ? 59 : 0, 0, 0);
    onChange(d.getTime());
    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  return (
    <div className="flex flex-col w-[280px]">
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

      <CardContent className="p-1">
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={handleSelect}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          fixedWeeks
          initialFocus
          className="p-0"
        />
      </CardContent>

      <CardFooter className="flex flex-wrap gap-1 border-t p-2">
        {[
          { label: "Today", value: 0 },
          { label: "Tomorrow", value: 1 },
          { label: "In 3 days", value: 3 },
          { label: "In a week", value: 7 },
          { label: "In 2 weeks", value: 14 },
        ].map((preset) => (
          <Button
            key={preset.value}
            variant="outline"
            size="sm"
            className="flex-1 font-bold text-[9px] h-7 px-1 uppercase tracking-tighter"
            onClick={() => setQuick(preset.value)}
          >
            {preset.label}
          </Button>
        ))}
      </CardFooter>
    </div>
  );
};
