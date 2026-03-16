import React from 'react';
import { AlertCircle, LucideIcon, RotateCcw } from 'lucide-react';
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
export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, message, action, className = '' }) => (
  <div className={cn(
    "flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in zoom-in-95 duration-500",
    className
  )}>
    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        {Icon && <Icon size={24} className="text-muted-foreground/50" />}
    </div>
    <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
    {message && <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mb-6">{message}</p>}
    {action}
  </div>
);

/**
 * Presentational component for displaying error messages with an optional retry action.
 *
 * @component
 */
export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="p-6 rounded-xl bg-destructive/5 border border-destructive/10 flex flex-col items-center text-center animate-in fade-in duration-300">
    <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
        <AlertCircle className="text-destructive" size={20} />
    </div>
    <p className="text-sm font-medium text-foreground mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-lg transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

/**
 * Floating notification component that appears at the bottom of the screen.
 * Supports an optional "Undo" action for reversible operations like task completion.
 * @deprecated Use `sonner` for toast notifications.
 *
 * @component
 */
export const Toast: React.FC<{
  /** Message to display in the toast. */
  message: string;
  /** Whether the toast is currently visible. */
  isVisible: boolean;
  /** Optional callback to trigger an undo operation. */
  onUndo?: () => void;
}> = ({ message, isVisible, onUndo }) => (
  <div
    className={cn(
      "fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-background border border-border shadow-lg",
      "px-4 py-2.5 rounded-full flex items-center gap-3 transition-all duration-300 ease-out",
      isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95 pointer-events-none'
    )}
  >
    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
    <span className="text-sm font-medium text-foreground tracking-wide whitespace-nowrap">{message}</span>
    {onUndo && (
      <>
        <div className="w-px h-4 bg-border mx-2"></div>
        <button
          onClick={onUndo}
          className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
        >
          <RotateCcw size={12} />
          <span>Undo</span>
        </button>
      </>
    )}
  </div>
);
