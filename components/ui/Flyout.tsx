'use client';

import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFlyoutPosition } from '@/hooks/useFlyoutPosition';

type FlyoutProps = {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  triggerEl: HTMLElement | null;
  position?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
};

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
