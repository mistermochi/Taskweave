'use client';

import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFlyoutPosition } from '@/hooks/useFlyoutPosition';

/**
 * Interface for Flyout props.
 */
type FlyoutProps = {
  /** The content to render inside the flyout. */
  children: React.ReactNode;
  /** Whether the flyout is currently visible. */
  isOpen: boolean;
  /** Callback triggered when the flyout should close (e.g., clicking outside). */
  onClose: () => void;
  /** The DOM element that triggered the flyout (used for positioning). */
  triggerEl: HTMLElement | null;
  /** Preferred position relative to the trigger. */
  position?: 'top' | 'right' | 'bottom' | 'left';
  /** Optional custom CSS classes. */
  className?: string;
};

/**
 * A low-level UI component for rendering floating menus, popovers, or tooltips.
 * It uses React Portals to render at the top level of the DOM, avoiding
 * overflow and z-index issues in nested containers.
 *
 * @component
 * @interaction
 * - Automatically positions itself relative to the `triggerEl` using `useFlyoutPosition`.
 * - Closes when the user clicks outside the flyout or the trigger element.
 * - Supports closing via the 'Escape' key.
 */
const Flyout: React.FC<FlyoutProps> = ({ 
    children, 
    isOpen, 
    onClose, 
    triggerEl, 
    position = 'bottom', 
    className = '' 
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const style = useFlyoutPosition(triggerEl, contentRef, isOpen, position);
  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        triggerEl &&
        !triggerEl.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, triggerEl]);

  if (!isMounted || !isOpen) {
    return null;
  }

  return createPortal(
    <div
      ref={contentRef}
      data-flyout-container="true"
      className={`fixed z-[80] bg-surface border border-border rounded-xl p-2 shadow-lg animate-in fade-in-0 zoom-in-95 ${className}`}
      style={style}
    >
      {children}
    </div>,
    document.body
  );
};

export default Flyout;
