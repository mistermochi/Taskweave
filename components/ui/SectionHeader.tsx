import React from 'react';

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
 *
 * @component
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, action, className='' }) => (
  <div className={`flex items-end justify-between mb-4 px-1 ${className}`}>
    <div>
      <h2 className="text-xs font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
        {title}
      </h2>
      {subtitle && <p className="text-sm text-white/60 font-medium mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);
