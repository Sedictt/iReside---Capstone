import * as React from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

/** Border/ring classes for an input in its error state; matches the auth and settings forms. */
export const fieldErrorClass = "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 focus-visible:ring-rose-500/20"

interface FieldErrorProps {
  /** Must match the input's `aria-describedby` (use `form.errorId(name)`). */
  id: string
  message?: string
  className?: string
}

/**
 * Inline field error. Announced politely to assistive tech and linked to its
 * input through `aria-describedby`; renders nothing when there is no error.
 */
export function FieldError({ id, message, className }: FieldErrorProps) {
  return (
    <div aria-live="polite" className="contents">
      {message ? (
        <p id={id} className={cn("mt-1.5 flex items-start gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400", className)}>
          <AlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          <span>{message}</span>
        </p>
      ) : null}
    </div>
  )
}
