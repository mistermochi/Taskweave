import * as React from "react"
import { cn } from "@/shared/lib/utils"

export interface AutoResizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number
  maxRows?: number
}

const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  ({ className, minRows = 1, maxRows, onChange, value, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)

    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current
      if (!textarea) return

      textarea.style.height = "auto"

      const computedStyle = window.getComputedStyle(textarea)
      let lineHeight = parseInt(computedStyle.lineHeight)

      if (isNaN(lineHeight)) {
        // Fallback to font-size * 1.2 if line-height is 'normal'
        const fontSize = parseInt(computedStyle.fontSize)
        lineHeight = fontSize * 1.2
      }

      const paddingTop = parseInt(computedStyle.paddingTop)
      const paddingBottom = parseInt(computedStyle.paddingBottom)
      const borderTop = parseInt(computedStyle.borderTopWidth)
      const borderBottom = parseInt(computedStyle.borderBottomWidth)

      const minHeight = minRows * lineHeight + paddingTop + paddingBottom + borderTop + borderBottom
      const maxHeight = maxRows ? maxRows * lineHeight + paddingTop + paddingBottom + borderTop + borderBottom : Infinity

      const isBorderBox = computedStyle.boxSizing === "border-box"
      let heightValue = textarea.scrollHeight
      if (isBorderBox) {
        // scrollHeight includes content and padding, but not border.
        // border-box height includes content, padding and border.
        heightValue += borderTop + borderBottom
      } else {
        // content-box height only includes content.
        heightValue -= (paddingTop + paddingBottom)
      }

      const newHeight = Math.min(Math.max(heightValue, minHeight), maxHeight)
      textarea.style.height = `${newHeight}px`

      if (maxRows && textarea.scrollHeight > maxHeight) {
        textarea.style.overflowY = "auto"
      } else {
        textarea.style.overflowY = "hidden"
      }
    }, [minRows, maxRows])

    React.useEffect(() => {
      adjustHeight()
    }, [adjustHeight, value])

    // Re-adjust on window resize
    React.useEffect(() => {
      window.addEventListener("resize", adjustHeight)
      return () => window.removeEventListener("resize", adjustHeight)
    }, [adjustHeight])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight()
      if (onChange) {
        onChange(e)
      }
    }

    return (
      <textarea
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={(node) => {
          textareaRef.current = node
          if (typeof ref === "function") {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
        }}
        onChange={handleChange}
        value={value}
        {...props}
      />
    )
  }
)
AutoResizeTextarea.displayName = "AutoResizeTextarea"

export { AutoResizeTextarea }
