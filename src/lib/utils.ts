import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a numeric input string or number with thousands separator commas.
 * If requireDecimals is true (e.g. on blur or preset selection), formats to 2 decimal places (.00).
 * While typing (requireDecimals=false): preserves dot and up to 2 decimal digits without forcing .00.
 */
export function formatCurrencyInput(val: string | number | undefined | null, requireDecimals = false): string {
  if (val === undefined || val === null) return ''
  const str = String(val).replace(/,/g, '').trim()
  if (str === '') return ''
  
  // Strip anything that is not digits or dot
  const clean = str.replace(/[^0-9.]/g, '')
  if (!clean) return ''

  if (requireDecimals) {
    const num = parseFloat(clean)
    if (isNaN(num)) return ''
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Split integer and decimal parts (handling multiple dots by keeping first)
  const dotIndex = clean.indexOf('.')
  let integerPart = dotIndex !== -1 ? clean.slice(0, dotIndex) : clean
  const decimalPart = dotIndex !== -1 ? clean.slice(dotIndex + 1).replace(/\./g, '') : null

  // Remove leading zeros from integer part unless it's just '0'
  integerPart = integerPart.replace(/^0+(?=\d)/, '') || '0'
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  if (decimalPart !== null) {
    // Preserve trailing decimal point or decimal digits up to 2 places while typing
    return `${formattedInteger}.${decimalPart.slice(0, 2)}`
  }

  return formattedInteger
}

/**
 * Parses a currency input string (with commas and optional decimals) to a standard number.
 */
export function parseCurrency(val: string | number | undefined | null): number {
  if (val === undefined || val === null || val === '') return 0
  const clean = String(val).replace(/,/g, '').trim()
  const num = parseFloat(clean)
  return isNaN(num) ? 0 : num
}

