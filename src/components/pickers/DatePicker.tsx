'use client';

import React from 'react';
import { format, addDays, nextSaturday } from 'date-fns';
import { Calendar } from '@/shared/ui/ui/calendar';
import { Button } from '@/shared/ui/ui/button';
import { PickerContainer } from './PickerContainer';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { cn } from '@/shared/lib/utils';

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
 * A specialized date selection component for tasks, modeled after the snooze flyover.
 * It provides quick-select buttons for common offsets (Today, Tomorrow, Weekend, Next Week)
 * and a standard shadcn Calendar for custom selection.
 *
 * @component
 */
export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, type }) => {
  const today = new Date();
  const isMobile = useIsMobile();

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
    <PickerContainer
      title={type === 'due' ? 'Due Date' : 'Schedule Date'}
      onClear={value ? () => onChange(undefined) : undefined}
      className="p-0"
    >
      <div className={cn(
        "flex w-full",
        isMobile ? "flex-col" : "min-w-[535px]"
      )}>
        <div className={cn(
          "flex flex-col gap-2 py-4",
          isMobile ? "border-b px-0" : "border-r px-2"
        )}>
          <div className="px-4 text-sm font-medium">Quick select</div>
          <div className="grid min-w-[250px] gap-1">
            <Button
              variant="ghost"
              className="justify-start font-normal"
              onClick={() => setQuick(today)}
            >
              Today
              <span className="text-muted-foreground ml-auto">
                {format(today, "E, MMM d")}
              </span>
            </Button>
            <Button
              variant="ghost"
              className="justify-start font-normal"
              onClick={() => setQuick(addDays(today, 1))}
            >
              Tomorrow
              <span className="text-muted-foreground ml-auto">
                {format(addDays(today, 1), "E, MMM d")}
              </span>
            </Button>
            <Button
              variant="ghost"
              className="justify-start font-normal"
              onClick={() => setQuick(nextSaturday(today))}
            >
              This weekend
              <span className="text-muted-foreground ml-auto">
                {format(nextSaturday(today), "E, MMM d")}
              </span>
            </Button>
            <Button
              variant="ghost"
              className="justify-start font-normal"
              onClick={() => setQuick(addDays(today, 7))}
            >
              Next week
              <span className="text-muted-foreground ml-auto">
                {format(addDays(today, 7), "E, MMM d")}
              </span>
            </Button>
          </div>
        </div>
        <div className="p-2">
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={handleSelect}
            initialFocus
          />
        </div>
      </div>
    </PickerContainer>
  );
};
