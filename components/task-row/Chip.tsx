
'use client';

import React, { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import Flyout from '@/components/ui/Flyout';

const chipVariants = cva(
  'flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xxs font-bold transition-colors select-none',
  {
    variants: {
      isActive: {
        true: '', // Applied via className for dynamic colors or compound variants for static
        false: 'bg-foreground/5 border-transparent text-secondary hover:bg-foreground/10 hover:text-foreground',
      },
    },
    defaultVariants: {
      isActive: false,
    },
  }
);


interface ChipProps extends VariantProps<typeof chipVariants> {
  icon?: React.ElementType;
  label: React.ReactNode;
  
  // Style props
  colorClass?: string;
  bgClass?: string;
  borderClass?: string;
  iconColor?: string;
  labelColor?: string;
  buttonStyle?: React.CSSProperties;
  
  // State
  isEditing?: boolean;
  fill?: boolean;
  
  // Flyout content is now a render prop
  flyoutContent?: (close: () => void) => React.ReactNode;
  flyoutPosition?: 'top' | 'right' | 'bottom' | 'left';
  
  // Visual tweaks
  className?: string;
}

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
  
  // Read-Only View
  if (!isEditing) {
    if (!isActive && !label) return null; // Don't render empty chips in read-only
    return (
      <div className={`flex items-center gap-1 text-xs transition-colors ${className} ${colorClass} ${isActive ? 'font-medium' : 'opacity-70'}`}>
        {Icon && <Icon size={10} className={fill && isActive ? 'fill-current' : ''} style={iconColor ? { color: iconColor } : {}} />}
        <span style={labelColor ? { color: labelColor } : {}}>{label}</span>
      </div>
    );
  }

  // Combine classes for the button
  const buttonClasses = chipVariants({
    isActive,
    className: isActive ? `${bgClass} ${borderClass} ${colorClass} ${className}` : className
  });

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

  // Edit Mode Button
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
