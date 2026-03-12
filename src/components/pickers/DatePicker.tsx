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
      <div className="flex flex-row items-stretch max-w-full">
        <div className="p-0 border-r shrink-0">
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={handleSelect}
            initialFocus
            className="p-0 scale-90 origin-top-left"
          />
        </div>
        <div className="flex flex-col gap-0 p-0.5 justify-center min-w-[65px] shrink-0">
          <div className="grid grid-cols-1 gap-0">
            <Button
              variant="ghost"
              size="sm"
              className="justify-center font-semibold text-[9px] h-7 px-1 uppercase tracking-tighter"
              onClick={() => setQuick(today)}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-center font-semibold text-[9px] h-7 px-1 uppercase tracking-tighter"
              onClick={() => setQuick(addDays(today, 1))}
            >
              Tmw
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-center font-semibold text-[9px] h-7 px-1 uppercase tracking-tighter"
              onClick={() => setQuick(nextSaturday(today))}
            >
              Wknd
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-center font-semibold text-[9px] h-7 px-1 uppercase tracking-tighter"
              onClick={() => setQuick(addDays(today, 7))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </PickerContainer>
  );
};
