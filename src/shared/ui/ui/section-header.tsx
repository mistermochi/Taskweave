import React from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Interface for SectionHeader props.
 */
interface SectionHeaderProps {
  /** The primary title for the section. */
  title: string;
  /** Optional secondary text or description. */
  subtitle?: string;
  /** Optional element to render on the right side of the header. */
  action?: React.ReactNode;
  /** Optional custom CSS classes. */
  className?: string;
}

/**
 * A standard header for content sections within a view.
 * Provides a consistent layout for titles and context-specific actions.
 * Optimized to be sticky within scrollable containers.
 *
 * @component
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, action, className }) => (
  <div className={cn(
    "text-muted-foreground sticky top-0 bg-background/95 z-10 py-2 text-[10px] font-bold uppercase tracking-wider backdrop-blur flex items-center justify-between px-1",
    className
  )}>
    <div>
      <h3 className="flex items-center gap-2">
        {title}
      </h3>
      {subtitle && <p className="text-[10px] text-muted-foreground/60 font-medium normal-case tracking-normal mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);
