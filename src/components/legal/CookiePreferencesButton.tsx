"use client"

import { Cookie } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OPEN_COOKIE_PREFERENCES_EVENT } from "@/components/cookie-consent"

/** Reopens the cookie preferences panel so users can review or change their choice at any time. */
export function CookiePreferencesButton() {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT))}
      className="rounded-xl border-border gap-2 h-9 px-4 print:hidden"
    >
      <Cookie className="size-4" aria-hidden="true" />
      Review cookie preferences
    </Button>
  )
}
