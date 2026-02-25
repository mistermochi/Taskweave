import React from 'react';
import { Loader2, AlertCircle, LucideIcon, RotateCcw } from 'lucide-react';

/**
 * Standard fullscreen or container-level loading indicator.
 *
 * @component
 */
export const LoadingScreen: React.FC<{ text?: string }> = ({ text = "Loading..." }) => (
  <div className="h-full w-full flex flex-col items-center justify-center p-6 text-secondary animate-fade-in">
    <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
    <span className="text-xs font-medium tracking-widest uppercase">{text}</span>
  </div>
);

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
  <div className={`flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in ${className}`}>
    {Icon && <Icon size={32} className="mb-3 text-secondary/40" />}
    <h3 className="text-sm font-bold text-foreground mb-1">{title}</h3>
    {message && <p className="text-xs text-secondary/60 max-w-xs leading-relaxed mb-4">{message}</p>}
    {action}
  </div>
);

/**
 * Presentational component for displaying error messages with an optional retry action.
 *
 * @component
 */
export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col items-center text-center">
    <AlertCircle className="text-red-400 mb-2" size={20} />
    <p className="text-sm text-red-300 mb-3">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="text-xs font-bold bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

/**
 * Floating notification component that appears at the bottom of the screen.
 * Supports an optional "Undo" action for reversible operations like task completion.
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
    className={`
      fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-surface border border-border shadow-[0_0_20px_rgba(0,0,0,0.3)]
      px-4 py-2.5 rounded-full flex items-center gap-3 transition-all duration-300 ease-out
      ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}
    `}
  >
    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
    <span className="text-sm font-medium text-foreground tracking-wide whitespace-nowrap">{message}</span>
    {onUndo && (
      <>
        <div className="w-px h-4 bg-border mx-2"></div>
        <button
          onClick={onUndo}
          className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-dim transition-colors"
        >
          <RotateCcw size={12} />
          <span>Undo</span>
        </button>
      </>
    )}
  </div>
);
