"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const TooltipRoot = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipArrow = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Arrow>
>(({ className, ...props }, ref) => (
  <TooltipPrimitive.Arrow
    ref={ref}
    className={cn(
      "fill-slate-900 dark:fill-zinc-900 border-slate-700/50 dark:border-white/10",
      className
    )}
    {...props}
  />
))
TooltipArrow.displayName = TooltipPrimitive.Arrow.displayName

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    showArrow?: boolean
  }
>(({ className, sideOffset = 6, showArrow = false, children, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-[9999] max-w-xs overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/95 px-3.5 py-2 text-xs font-medium text-slate-100 shadow-[0_10px_38px_-10px_rgba(0,0,0,0.5),0_10px_20px_-15px_rgba(0,0,0,0.4)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/95 dark:text-zinc-100",
        "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-1.5 data-[side=left]:slide-in-from-right-1.5 data-[side=right]:slide-in-from-left-1.5 data-[side=top]:slide-in-from-bottom-1.5",
        "select-none pointer-events-none transition-all duration-150 ease-out",
        className
      )}
      {...props}
    >
      {children}
      {showArrow && (
        <TooltipPrimitive.Arrow className="fill-slate-950 dark:fill-zinc-900" />
      )}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export interface TooltipProps extends React.ComponentPropsWithoutRef<typeof TooltipRoot> {
  content?: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  sideOffset?: number
  showArrow?: boolean
  className?: string
  asChild?: boolean
}

/**
 * Universal Tooltip component that can be used either:
 * 1. Shorthand: `<Tooltip content="Helpful text"><Button>Hover</Button></Tooltip>`
 * 2. Composable: `<Tooltip><TooltipTrigger>...</TooltipTrigger><TooltipContent>...</TooltipContent></Tooltip>`
 */
function Tooltip({
  children,
  content,
  side = "top",
  align = "center",
  sideOffset = 6,
  showArrow = false,
  className,
  asChild = true,
  ...props
}: TooltipProps) {
  // If `content` prop is not passed, acts as standard Radix Tooltip root
  if (!content) {
    return <TooltipRoot {...props}>{children}</TooltipRoot>
  }

  return (
    <TooltipRoot {...props}>
      <TooltipTrigger asChild={asChild}>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        showArrow={showArrow}
        className={className}
      >
        {content}
      </TooltipContent>
    </TooltipRoot>
  )
}

export { Tooltip, TooltipRoot, TooltipTrigger, TooltipContent, TooltipArrow, TooltipProvider }
