"use client";

/**
 * The phone field used everywhere in iReside. "+63" is always shown at the start and can't be
 * deleted; people type only the 10 numbers after it ("917 123 4567"). Pasting "09…" or
 * "+63 9…" also works. The value given back is "" when empty, otherwise "+63" + the digits
 * typed so far, so the saved form is "+639171234567". See src/lib/phone.ts for the rule.
 */

import { forwardRef, useCallback, useId, useLayoutEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useLanguageContext } from "@/context/LanguageContext";
import {
    PH_COUNTRY_CODE,
    PH_MOBILE_DIGITS,
    groupPhMobileDigits,
    phMobileDigits,
    phMobileFieldValue,
    readPhMobileInput,
} from "@/lib/phone";

export interface PhoneNumberInputProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "type" | "maxLength"> {
    value: string | null | undefined;
    /** "" when empty, otherwise "+63" followed by the digits typed so far. */
    onValueChange: (value: string) => void;
    /** Classes for the wrapper (width, margins). The input itself takes `className`. */
    wrapperClassName?: string;
    /** Classes for the "+63" text, e.g. to match a coloured input. */
    prefixClassName?: string;
}

/** Index in the grouped text ("917 123 4567") just after the n-th digit. */
function caretAfterDigits(grouped: string, count: number) {
    if (count <= 0) return 0;
    let seen = 0;
    for (let i = 0; i < grouped.length; i += 1) {
        if (/\d/.test(grouped[i])) seen += 1;
        if (seen === count) return i + 1;
    }
    return grouped.length;
}

export const PhoneNumberInput = forwardRef<HTMLInputElement, PhoneNumberInputProps>(function PhoneNumberInput(
    { value, onValueChange, wrapperClassName, prefixClassName, className, style, placeholder, "aria-describedby": describedBy, ...rest },
    forwardedRef,
) {
    const { t } = useLanguageContext();
    const hintId = useId();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const prefixRef = useRef<HTMLSpanElement | null>(null);
    const pendingCaretRef = useRef<number | null>(null);
    const [layout, setLayout] = useState<{ left: number; padding: number; fontSize: string } | null>(null);

    const setRefs = useCallback(
        (node: HTMLInputElement | null) => {
            inputRef.current = node;
            if (typeof forwardedRef === "function") forwardedRef(node);
            else if (forwardedRef) forwardedRef.current = node;
        },
        [forwardedRef],
    );

    const grouped = groupPhMobileDigits(phMobileDigits(value ?? ""));

    // Put "+63" where the text would start and push the typed digits after it. The input's own
    // padding and font size are read once, so any input style (settings kit, forms) lines up.
    useLayoutEffect(() => {
        const input = inputRef.current;
        const prefix = prefixRef.current;
        if (!input || !prefix || layout) return;
        // Read the padding the input's classes give it, not the placeholder padding set below.
        const placeholderPadding = input.style.paddingLeft;
        input.style.paddingLeft = "";
        const computed = window.getComputedStyle(input);
        const left = parseFloat(computed.paddingLeft) || 12;
        input.style.paddingLeft = placeholderPadding;
        prefix.style.fontSize = computed.fontSize;
        const gap = parseFloat(computed.fontSize) * 0.4;
        setLayout({ left, padding: left + prefix.offsetWidth + gap, fontSize: computed.fontSize });
    }, [layout]);

    // Keep the cursor next to the digit it was after once spaces are added or removed.
    useLayoutEffect(() => {
        const input = inputRef.current;
        if (pendingCaretRef.current === null || !input || document.activeElement !== input) return;
        const position = caretAfterDigits(input.value, pendingCaretRef.current);
        pendingCaretRef.current = null;
        input.setSelectionRange(position, position);
    }, [grouped]);

    return (
        <div className={cn("relative", wrapperClassName)}>
            <span
                ref={prefixRef}
                aria-hidden
                className={cn("pointer-events-none absolute inset-y-0 flex items-center font-semibold text-foreground", prefixClassName)}
                style={{ left: layout?.left ?? 12, fontSize: layout?.fontSize }}
            >
                {PH_COUNTRY_CODE}
            </span>
            <span id={hintId} className="sr-only">
                {t("The country code +63 is already filled in. Type the 10 numbers after it.")}
            </span>
            <input
                ref={setRefs}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                // 10 digits and 2 spaces.
                maxLength={PH_MOBILE_DIGITS + 2}
                placeholder={placeholder ?? "917 123 4567"}
                value={grouped}
                onChange={(event) => {
                    const input = event.target;
                    const caret = input.selectionStart ?? input.value.length;
                    const { digits, droppedPrefix } = readPhMobileInput(input.value);
                    const digitsBeforeCaret = input.value.slice(0, caret).replace(/\D/g, "").length;
                    pendingCaretRef.current = Math.min(digits.length, Math.max(0, digitsBeforeCaret - droppedPrefix));
                    onValueChange(phMobileFieldValue(digits));
                }}
                onPaste={(event) => {
                    // A whole pasted number ("+63 917 123 4567", "09171234567") is longer than the
                    // box allows, so read it in full and replace what was there.
                    const pasted = event.clipboardData.getData("text");
                    const { digits } = readPhMobileInput(pasted);
                    if (digits.length < PH_MOBILE_DIGITS && !pasted.includes("+")) return;
                    event.preventDefault();
                    pendingCaretRef.current = digits.length;
                    onValueChange(phMobileFieldValue(digits));
                }}
                aria-describedby={cn(describedBy, hintId) || undefined}
                className={className}
                style={{ ...style, paddingLeft: layout?.padding ?? "3.75rem" }}
                {...rest}
            />
        </div>
    );
});
