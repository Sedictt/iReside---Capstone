"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export interface ThemeToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "sidebar"
  dataTourId?: string
}

export function ThemeToggle({ variant = "default", dataTourId, className, ...props }: ThemeToggleProps) {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div 
        className={cn(
          "size-10 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/[0.02]",
          variant === "sidebar" && "border-transparent bg-transparent",
          className
        )}
      />
    )
  }

  return (
    <button
      {...props}
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={cn(
        "relative flex size-10 items-center justify-center rounded-xl border transition-all",
        variant === "default" && "border-zinc-200 bg-zinc-50 text-zinc-900 hover:bg-zinc-100 hover:border-zinc-300 dark:border-white/10 dark:bg-white/[0.02] dark:text-white dark:hover:bg-white/[0.08] dark:hover:border-white/20",
        variant === "sidebar" && "border-transparent bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
      title="Toggle theme"
      data-tour-id={dataTourId}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}