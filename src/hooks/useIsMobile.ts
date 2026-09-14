'use client'

import { useState, useEffect } from 'react'

const MOBILE_BREAKPOINT = 768

/**
 * Returns true when the viewport width is below the mobile breakpoint (< 768px).
 * Handles SSR gracefully by returning false on the server.
 */
export function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState<boolean>(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
        }

        // Run immediately on mount
        checkMobile()

        const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
        mediaQuery.addEventListener('change', checkMobile)

        return () => mediaQuery.removeEventListener('change', checkMobile)
    }, [])

    return isMobile
}
