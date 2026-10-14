"use client"

import { Fragment, type ReactNode } from "react"
import { useLanguageContext } from "@/context/LanguageContext"

/**
 * Renders the English or the Filipino version of a legal document (Privacy Policy,
 * Terms of Service) based on the selected UI language. Both versions are built on the
 * server; the `key` remounts the document shell so its section search index is rebuilt
 * for the language now shown. The server and first client render are always English.
 */
export function LocalizedLegalDocument({ en, fil }: { en: ReactNode; fil: ReactNode }) {
  const { isFilipino } = useLanguageContext()
  return <Fragment key={isFilipino ? "fil" : "en"}>{isFilipino ? fil : en}</Fragment>
}

/** Courtesy-translation notice shown at the top of the Filipino version. */
export function FilipinoCourtesyNotice() {
  return (
    <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground/90">
      Ang bersyong Filipino na ito ay salin para sa inyong kaginhawahan lamang. Kung may
      pagkakaiba o salungatan sa pagitan ng bersyong Filipino at ng bersyong English, ang
      bersyong English ang masusunod.
    </p>
  )
}
