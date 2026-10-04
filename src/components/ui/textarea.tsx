import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  showCount?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, maxLength = 500, showCount = false, value, defaultValue, onChange, ...props }, ref) => {
    const [currentLength, setCurrentLength] = React.useState<number>(() => {
      if (typeof value === "string") return value.length
      if (typeof defaultValue === "string") return defaultValue.length
      return 0
    })

    React.useEffect(() => {
      if (typeof value === "string") {
        setCurrentLength(value.length)
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCurrentLength(e.target.value.length)
      onChange?.(e)
    }

    return (
      <div className="relative w-full">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            showCount && "pb-6",
            className
          )}
          maxLength={maxLength}
          ref={ref}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          {...props}
        />
        {showCount && maxLength ? (
          <div className="absolute bottom-1.5 right-2.5 text-[10px] font-medium text-muted-foreground/70 pointer-events-none select-none">
            {currentLength} / {maxLength}
          </div>
        ) : null}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
