'use client';

import React from 'react';
import { addDays, nextSaturday } from 'date-fns';
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
      className="p-0 overflow-hidden"
    >
      <div className={cn(
        "flex",
        isMobile ? "flex-col w-full" : "flex-row items-stretch min-w-[380px]"
      )}>
        <div className={cn(
          "p-2",
          !isMobile && "border-r"
        )}>
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={handleSelect}
            initialFocus
          />
        </div>
        <div className={cn(
          "flex flex-col gap-1 p-2 justify-center",
          isMobile ? "border-t w-full" : "min-w-[100px]"
        )}>
          <div className={cn(
            "grid gap-1",
            isMobile ? "grid-cols-2 w-full" : "grid-cols-1"
          )}>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start font-medium text-xs h-8"
              onClick={() => setQuick(today)}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start font-medium text-xs h-8"
              onClick={() => setQuick(addDays(today, 1))}
            >
              Tomorrow
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start font-medium text-xs h-8"
              onClick={() => setQuick(nextSaturday(today))}
            >
              Weekend
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start font-medium text-xs h-8"
              onClick={() => setQuick(addDays(today, 7))}
            >
              Next week
            </Button>
          </div>
        </div>
      </div>
    </PickerContainer>
  );
};
