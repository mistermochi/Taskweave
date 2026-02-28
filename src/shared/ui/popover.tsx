"use client"
import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cn } from "@/shared/lib/utils"

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<React.ElementRef<typeof PopoverPrimitive.Content>, React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content ref={ref} align={align} sideOffset={sideOffset} className={cn("z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", className)} {...props} />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export const Flyout: React.FC<{ children: React.ReactNode; isOpen: boolean; onClose: () => void; triggerEl: HTMLElement | null; className?: string; position?: 'top' | 'right' | 'bottom' | 'left' }> = ({ children, isOpen, onClose, className, position = 'bottom', triggerEl }) => {
  const [anchor, setAnchor] = React.useState<DOMRect | null>(null);

  React.useEffect(() => {
    if (isOpen && triggerEl) {
        setAnchor(triggerEl.getBoundingClientRect());
    }
  }, [isOpen, triggerEl]);

  return (
    <Popover open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {anchor && (
        <PopoverPrimitive.Anchor
          virtualRef={{
            current: {
              getBoundingClientRect: () => anchor
            } as unknown as HTMLElement
          }}
        />
      )}
      <PopoverContent className={cn("w-auto p-3", className)} side={position} align="start">{children}</PopoverContent>
    </Popover>
  );
}

export { Popover, PopoverTrigger, PopoverContent }
export default Flyout
