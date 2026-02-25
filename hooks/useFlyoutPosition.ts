import { useState, useLayoutEffect, RefObject, useCallback } from 'react';

/**
 * Custom hook that calculates the optimal position for a flyout menu (like a popover or tooltip)
 * relative to a trigger element. It ensures the flyout stays within the viewport and adapts
 * to available space.
 *
 * @param triggerEl - The DOM element that triggers the flyout.
 * @param contentRef - Ref to the flyout content element.
 * @param isOpen - Whether the flyout is currently visible.
 * @param position - The preferred side to show the flyout ('top', 'right', 'bottom', 'left').
 * @returns An object with `top`, `left`, and `opacity` styles to apply to the flyout.
 */
export const useFlyoutPosition = (
  triggerEl: HTMLElement | null,
  contentRef: RefObject<HTMLDivElement>,
  isOpen: boolean,
  position: 'top' | 'right' | 'bottom' | 'left' = 'bottom'
) => {
  const [style, setStyle] = useState<{ top?: number; left?: number; opacity: number }>({ opacity: 0 });

  /**
   * Core positioning logic.
   * Calculates boundaries and chooses the best side based on space constraints.
   */
  const calculatePosition = useCallback(() => {
    if (!triggerEl || !contentRef.current) return;
    
    const trigger = triggerEl.getBoundingClientRect();
    const content = contentRef.current.getBoundingClientRect();
    const vpWidth = window.innerWidth;
    const vpHeight = window.innerHeight;
    const m = 8; // Margin from edges

    const positions = {
        right: {
            top: trigger.top + trigger.height / 2 - content.height / 2,
            left: trigger.right + m,
        },
        left: {
            top: trigger.top + trigger.height / 2 - content.height / 2,
            left: trigger.left - content.width - m,
        },
        bottom: {
            top: trigger.bottom + m,
            left: trigger.left + trigger.width / 2 - content.width / 2,
        },
        top: {
            top: trigger.top - content.height - m,
            left: trigger.left + trigger.width / 2 - content.width / 2,
        },
    };

    const hasSpace = {
        right: positions.right.left + content.width < vpWidth - m,
        left: positions.left.left > m,
        bottom: positions.bottom.top + content.height < vpHeight - m,
        top: positions.top.top > m,
    };
    
    const priority: ('top' | 'right' | 'bottom' | 'left')[] = [position, 'bottom', 'top', 'right', 'left'];
    const uniquePriority = Array.from(new Set(priority));

    let finalPosition: 'top' | 'right' | 'bottom' | 'left' | null = null;
    for (const pos of uniquePriority) {
        if (hasSpace[pos]) {
            finalPosition = pos;
            break;
        }
    }
    
    if (!finalPosition) {
        finalPosition = position;
    }
    
    let { top: t, left: l } = positions[finalPosition!];
    
    // Clamping to screen boundaries
    if (l < m) l = m;
    if (t < m) t = m;
    if (l + content.width > vpWidth - m) l = vpWidth - content.width - m;
    if (t + content.height > vpHeight - m) t = vpHeight - content.height - m;
    
    setStyle({ top: t, left: l, opacity: 1 });
  }, [triggerEl, contentRef, position]);

  useLayoutEffect(() => {
    if (isOpen) {
        calculatePosition();
    } else {
        setStyle({ opacity: 0 });
    }
  }, [isOpen, calculatePosition]);

  // Handle content resizing
  useLayoutEffect(() => {
    const node = contentRef.current;
    if (!isOpen || !node) return;

    const observer = new ResizeObserver(() => {
        calculatePosition();
    });

    observer.observe(node);

    return () => {
        observer.disconnect();
    };
  }, [isOpen, contentRef, calculatePosition]);
  
  // Handle viewport changes (scroll/resize)
  useLayoutEffect(() => {
    if (!isOpen) return;

    window.addEventListener('scroll', calculatePosition, true);
    window.addEventListener('resize', calculatePosition);

    return () => {
      window.removeEventListener('scroll', calculatePosition, true);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [isOpen, calculatePosition]);


  return style;
};
