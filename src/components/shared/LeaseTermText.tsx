"use client";

import { useLanguageContext } from "@/context/LanguageContext";
import {
    formatLeaseDate,
    formatTenure,
    leaseDateRangeLabel,
    leaseTermLabel,
    tenureSinceLabel,
    type LeaseTermLike,
} from "@/lib/lease-term";

type LeaseTermTextProps =
    /** "Since Mar 2024 · 1 year 7 months" */
    | { kind: "tenure-since"; start: string | null | undefined }
    /** "Open-ended" / "Ends Mar 15, 2027" / ... */
    | { kind: "term"; lease: LeaseTermLike }
    /** "Jan 5, 2025 – Open-ended" */
    | { kind: "range"; lease: LeaseTermLike }
    /** A single lease date. */
    | { kind: "date"; value: string | null | undefined; options?: Intl.DateTimeFormatOptions };

/**
 * Lease-term labels in the viewer's language. Lets server components render
 * the `@/lib/lease-term` helpers localized without becoming client components.
 */
export function LeaseTermText(props: LeaseTermTextProps) {
    const { language } = useLanguageContext();
    switch (props.kind) {
        case "tenure-since": {
            const since = tenureSinceLabel(props.start, language);
            const tenure = formatTenure(props.start, undefined, language);
            return <>{since && tenure ? `${since} · ${tenure}` : since || tenure}</>;
        }
        case "term":
            return <>{leaseTermLabel(props.lease, undefined, language)}</>;
        case "range":
            return <>{leaseDateRangeLabel(props.lease, language)}</>;
        case "date":
            return <>{formatLeaseDate(props.value, props.options, language)}</>;
    }
}
