import React from 'react';
import { X } from 'lucide-react';

/**
 * Interface for PickerContainer props.
 */
interface PickerContainerProps {
  /** Title to display at the top of the container. */
  title: string;
  /** Content to render inside the picker. */
  children: React.ReactNode;
  /** Optional custom CSS classes for the outer div. */
  className?: string;
  /** Optional callback to clear the picker's value. */
  onClear?: () => void;
}

/**
 * A standard wrapper for inline picker components (Date, Tag, Duration, etc.).
 * Provides a consistent header with a title and an optional clear button.
 *
 * @component
 */
export const PickerContainer: React.FC<PickerContainerProps> = ({ title, onClear, children, className = '' }) => {
  return (
    <div className={className}>
      <div className="flex items-center justify-between px-1 pb-1 mb-2 border-b border-white/5">
        <span className="text-xxs font-bold text-secondary uppercase tracking-wider">{title}</span>
        {onClear && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="text-secondary/70 hover:text-red-400 p-1 -mr-1"
          >
            <X size={12} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
};
