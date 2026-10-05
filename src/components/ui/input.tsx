import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, maxLength, ...props }, ref) => {
    // Provide safe fallback maxLength for text-like inputs to prevent unbounded input
    const isTextLike = !type || ["text", "email", "password", "tel", "search", "url"].includes(type)
    const effectiveMaxLength = maxLength !== undefined ? maxLength : (isTextLike ? 120 : undefined)

    return (
      <input
        type={type}
        maxLength={effectiveMaxLength}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
