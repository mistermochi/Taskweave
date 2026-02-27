'use client';

import React, { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import Flyout from '@/shared/ui/Flyout';

/**
 * Styling variants for the Chip component using Class Variance Authority.
 */
const chipVariants = cva(
  'flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xxs font-bold transition-colors select-none',
  {
    variants: {
      isActive: {
        true: '',
        false: 'bg-foreground/5 border-transparent text-secondary hover:bg-foreground/10 hover:text-foreground',
      },
    },
    defaultVariants: {
      isActive: false,
    },
  }
);

/**
 * Interface for Chip props.
 */
interface ChipProps extends VariantProps<typeof chipVariants> {
  /** Optional icon to display inside the chip. */
  icon?: React.ElementType;
  /** Main label content. */
  label: React.ReactNode;
  
  // Custom Style Properties
  colorClass?: string;
  bgClass?: string;
  borderClass?: string;
  iconColor?: string;
  labelColor?: string;
  buttonStyle?: React.CSSProperties;
  
  /** Whether the component is in a clickable, editable state. */
  isEditing?: boolean;
  /** Whether icons should be filled when active. */
  fill?: boolean;
  
  /** Optional render prop for flyout content. If provided, the chip becomes a toggle for this flyout. */
  flyoutContent?: (close: () => void) => React.ReactNode;
  /** Preferred position of the attached flyout. */
  flyoutPosition?: 'top' | 'right' | 'bottom' | 'left';
  
  className?: string;
}

/**
 * A highly versatile "badge-like" component used for task metadata (Energy, Duration, Tags).
 * It supports a read-only display mode and an interactive edit mode with an optional flyout menu.
 *
 * @component
 */
export const Chip: React.FC<ChipProps> = ({ 
  icon: Icon, 
  label, 
  colorClass = 'text-secondary', 
  bgClass = 'bg-white/10',
  borderClass = 'border-white/10',
  iconColor,
  labelColor,
  buttonStyle,
  isEditing, 
  isActive, 
  fill = false,
  flyoutContent,
  flyoutPosition = 'bottom',
  className = ''
}) => {
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  
  /**
   * Render Read-Only View (non-interactive inline metadata).
   */
  if (!isEditing) {
    if (!isActive && !label) return null;
    return (
      <div className={`flex items-center gap-1 text-xs transition-colors ${className} ${colorClass} ${isActive ? 'font-medium' : 'opacity-70'}`}>
        {Icon && <Icon size={10} className={fill && isActive ? 'fill-current' : ''} style={iconColor ? { color: iconColor } : {}} />}
        <span style={labelColor ? { color: labelColor } : {}}>{label}</span>
      </div>
    );
  }

  const buttonClasses = chipVariants({
    isActive,
    className: isActive ? `${bgClass} ${borderClass} ${colorClass} ${className}` : className
  });

  /**
   * Render Interactive View (a button that can trigger a flyout).
   */
  const buttonElement = (
    <button 
        ref={triggerRef}
        onClick={() => setIsFlyoutOpen(!isFlyoutOpen)}
        className={buttonClasses}
        style={buttonStyle}
      >
        {Icon && <Icon size={10} className={fill && isActive ? "fill-current" : ""} style={iconColor ? { color: iconColor } : undefined} />}
        <span style={labelColor ? { color: labelColor } : {}}>{label}</span>
        <ChevronDown size={8} className="opacity-50" />
      </button>
  );

  if (flyoutContent) {
      return (
          <>
            {buttonElement}
            <Flyout
                isOpen={isFlyoutOpen}
                onClose={() => setIsFlyoutOpen(false)}
                triggerEl={triggerRef.current}
                position={flyoutPosition}
            >
                {flyoutContent(() => setIsFlyoutOpen(false))}
            </Flyout>
          </>
      )
  }

  return buttonElement;
};
