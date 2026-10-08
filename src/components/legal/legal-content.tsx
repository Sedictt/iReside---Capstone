import type { ReactNode } from "react"

/**
 * Presentational building blocks for legal documents (Privacy Policy, Terms).
 * Server-safe: no hooks, no browser APIs.
 */

const LINK_CLASS =
  "text-primary hover:text-primary-dark font-medium underline underline-offset-4"

export function LegalLink({
  href,
  children,
  external = false,
}: {
  href: string
  children: ReactNode
  external?: boolean
}) {
  return (
    <a
      href={href}
      className={LINK_CLASS}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  )
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc pl-6 space-y-2">{children}</ul>
}

export function LegalSubheading({ children }: { children: ReactNode }) {
  return <h3 className="text-base font-bold text-foreground mt-6 mb-2 first:mt-0">{children}</h3>
}

interface LegalTableProps {
  /** Accessible description of the table (screen-reader only). */
  caption: string
  columns: string[]
  /** Each row is an array of cells; the first cell is rendered as the row header. */
  rows: ReactNode[][]
}

/**
 * Responsive, accessible data table. Scrolls horizontally on narrow screens
 * instead of breaking the page layout.
 */
export function LegalTable({ caption, columns, rows }: LegalTableProps) {
  return (
    <div className="not-prose my-4 overflow-x-auto rounded-xl border border-border print:overflow-visible">
      <table className="w-full min-w-[34rem] text-left text-sm print:min-w-0">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col" className="px-4 py-3">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border align-top">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) =>
                cellIndex === 0 ? (
                  <th
                    key={cellIndex}
                    scope="row"
                    className="px-4 py-3 font-semibold text-foreground"
                  >
                    {cell}
                  </th>
                ) : (
                  <td key={cellIndex} className="px-4 py-3 text-foreground/80">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
