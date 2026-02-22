
import { useState, useLayoutEffect, RefObject, useCallback } from 'react';

export const useFlyoutPosition = (
  triggerEl: HTMLElement | null,
  contentRef: RefObject<HTMLDivElement>,
  isOpen: boolean,
  position: 'top' | 'right' | 'bottom' | 'left' = 'bottom'
) => {
  const [style, setStyle] = useState<{ top?: number; left?: number; opacity: number }>({ opacity: 0 });

  const calculatePosition = useCallback(() => {
    if (!triggerEl || !contentRef.current) return;
    
    const trigger = triggerEl.getBoundingClientRect();
    const content = contentRef.current.getBoundingClientRect();
    const vpWidth = window.innerWidth;
    const vpHeight = window.innerHeight;
    const m = 8; // margin

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
    
    // Final clamping to ensure it's always on screen
    if (l < m) l = m;
    if (t < m) t = m;
    if (l + content.width > vpWidth - m) l = vpWidth - content.width - m;
    if (t + content.height > vpHeight - m) t = vpHeight - content.height - m;
    
    setStyle({ top: t, left: l, opacity: 1 });
  }, [triggerEl, contentRef, position]);

  useLayoutEffect(() => {
    if (isOpen) {
        // Initial calculation on open
        calculatePosition();
    } else {
        setStyle({ opacity: 0 });
    }
  }, [isOpen, calculatePosition]);

  // Effect to handle content resizing while the flyout is open
  useLayoutEffect(() => {
    const node = contentRef.current;
    if (!isOpen || !node) return;

    // Use ResizeObserver to recalculate position when content size changes
    const observer = new ResizeObserver(() => {
        calculatePosition();
    });

    observer.observe(node);

    return () => {
        observer.disconnect();
    };
  }, [isOpen, contentRef, calculatePosition]);
  
  // Effect to handle window scroll and resize
  useLayoutEffect(() => {
    if (!isOpen) return;

    window.addEventListener('scroll', calculatePosition, true); // `true` for capture phase
    window.addEventListener('resize', calculatePosition);

    return () => {
      window.removeEventListener('scroll', calculatePosition, true);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [isOpen, calculatePosition]);


  return style;
};
