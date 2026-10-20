'use client'

import { useEffect } from 'react'

/* ----------------------------------------------------------
   MobileSheetExit
   Bottom sheets across the mobile portal slide in through CSS
   (see mobile.css, "Motion"), but React unmounts them instantly
   on close, so CSS alone cannot animate the exit. This watches
   the DOM for a removed sheet overlay, drops an inert clone of it
   back in place, lets CSS slide the clone down and fade its
   backdrop, then removes the clone. No per-sheet changes needed.

   Sheets that framer-motion already animates out are marked
   `data-framer-sheet` and are skipped.
   ---------------------------------------------------------- */

const SHEET_SELECTOR = '[class*="rounded-t-2xl"], [class*="rounded-t-3xl"], [class*="rounded-t-["]'
const GHOST_LIFETIME_MS = 340

function isElement(node: Node): node is HTMLElement {
    return node.nodeType === Node.ELEMENT_NODE
}

/** A sheet framer-motion animates leaves inline transform/opacity behind; those exit on their own. */
function animatesItself(el: HTMLElement): boolean {
    if (el.closest('[data-framer-sheet]') || el.querySelector('[data-framer-sheet]')) return true
    const sheet = el.matches(SHEET_SELECTOR) ? el : el.querySelector<HTMLElement>(SHEET_SELECTOR)
    const candidates = [el, sheet].filter(Boolean) as HTMLElement[]
    return candidates.some((c) => c.style.transform !== '' || c.style.opacity !== '')
}

function overlaysIn(node: HTMLElement): HTMLElement[] {
    const fixed = node.matches('.fixed') ? [node] : Array.from(node.querySelectorAll<HTMLElement>('.fixed'))
    return fixed.filter((el) => {
        if (animatesItself(el)) return false
        return el.matches(SHEET_SELECTOR) || Boolean(el.querySelector(SHEET_SELECTOR)) || /bg-black\//.test(el.className)
    })
}

function ghost(overlay: HTMLElement) {
    const clone = overlay.cloneNode(true) as HTMLElement
    clone.classList.add('m-sheet-ghost')
    clone.setAttribute('aria-hidden', 'true')
    clone.removeAttribute('id')
    clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'))
    clone.querySelectorAll('[autofocus]').forEach((el) => el.removeAttribute('autofocus'))
    document.body.appendChild(clone)
    window.setTimeout(() => clone.remove(), GHOST_LIFETIME_MS)
}

export function MobileSheetExit() {
    useEffect(() => {
        const observer = new MutationObserver((records) => {
            for (const record of records) {
                record.removedNodes.forEach((node) => {
                    if (!isElement(node) || node.classList.contains('m-sheet-ghost')) return
                    const overlays = overlaysIn(node)
                    // Only ghost a real sheet dismissal: at least one overlay must hold a sheet.
                    if (!overlays.some((el) => el.matches(SHEET_SELECTOR) || el.querySelector(SHEET_SELECTOR))) return
                    overlays.forEach(ghost)
                })
            }
        })
        observer.observe(document.body, { childList: true, subtree: true })
        return () => observer.disconnect()
    }, [])

    return null
}
