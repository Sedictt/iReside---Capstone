"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 transition-all hover:bg-zinc-100 hover:border-zinc-300 dark:border-white/10 dark:bg-white/[0.02] dark:text-white dark:hover:bg-white/[0.08] dark:hover:border-white/20"
      title="Toggle theme"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}