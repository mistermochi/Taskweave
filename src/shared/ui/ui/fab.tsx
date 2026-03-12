import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/lib/utils"
import { Button } from "./button"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"

const fabVariants = cva(
  "z-50 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95",
  {
    variants: {
      size: {
        default: "h-14 w-14",
        sm: "h-12 w-12",
        lg: "h-16 w-16",
      },
      position: {
        fixed: "fixed bottom-6 right-6",
        absolute: "absolute bottom-6 right-6",
        static: "",
      }
    },
    defaultVariants: {
      size: "default",
      position: "fixed",
    },
  }
)

export interface FabProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof fabVariants> {
  icon: React.ReactNode
  label: string
  tooltip?: string
}

const Fab = React.forwardRef<HTMLButtonElement, FabProps>(
  ({ className, size, position, icon, label, tooltip, ...props }, ref) => {
    const fabButton = (
      <Button
        variant="default"
        size="icon"
        className={cn(fabVariants({ size, position, className }), "[&_svg]:size-6")}
        ref={ref}
        {...props}
      >
        {icon}
        <span className="sr-only">{label}</span>
      </Button>
    )

    if (tooltip) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{fabButton}</TooltipTrigger>
          <TooltipContent side="left">{tooltip}</TooltipContent>
        </Tooltip>
      )
    }

    return fabButton
  }
)
Fab.displayName = "Fab"

export { Fab, fabVariants }
