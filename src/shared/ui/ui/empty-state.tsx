import React, { useId } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

/**
 * Interface for EmptyState props.
 */
interface EmptyStateProps {
  /** Optional icon to illustrate the state. */
  icon?: LucideIcon;
  /** Primary title text. */
  title: string;
  /** Optional descriptive message. */
  message?: string;
  /** Optional element to render below the message (e.g., an "Add" button). */
  action?: React.ReactNode;
  /** Optional custom CSS classes. */
  className?: string;
}

/**
 * Presentational component for empty lists or missing data.
 *
 * @component
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, message, action, className = '' }) => {
  const titleId = useId();

  return (
    <div
      role="region"
      aria-labelledby={titleId}
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in zoom-in-95 duration-500",
        className
      )}
    >
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4" aria-hidden="true">
        {Icon && <Icon size={24} className="text-muted-foreground/50" />}
      </div>
      <h3 id={titleId} className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      {message && <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mb-6">{message}</p>}
      {action}
    </div>
  );
};
