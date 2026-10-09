"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import type { FieldRuleResult } from "@/lib/validation/rules";

/**
 * A rule receives the field's value plus every form value, so cross-field
 * checks (end date vs start date, confirm vs password) re-run automatically
 * whenever either side changes.
 */
export type FormRule<V> = (value: V[keyof V], values: V) => FieldRuleResult;
export type FormRules<V> = Partial<{ [K in keyof V]: (value: V[K], values: V) => FieldRuleResult }>;

/**
 * Inline validation for controlled forms.
 *
 * - Errors are derived from current values, so they clear the moment input becomes valid.
 * - A field's error is only shown after it has been blurred or a submit was attempted,
 *   so users are not shown errors while still typing their first value.
 * - `validateAll()` reveals every error and focuses the first invalid field.
 * - `setServerErrors()` attaches API `fieldErrors`; each clears when its field is edited.
 */
export function useFormValidation<V extends Record<string, unknown>>(values: V, rules: FormRules<V>) {
  const formId = useId();
  const [touched, setTouched] = useState<Partial<Record<keyof V, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrorsState] = useState<{ errors: Partial<Record<string, string>>; snapshot: Partial<V> }>({ errors: {}, snapshot: {} });
  const rulesRef = useRef(rules);
  rulesRef.current = rules;

  const errors = useMemo(() => {
    const next: Partial<Record<keyof V, string>> = {};
    for (const key of Object.keys(rulesRef.current) as (keyof V)[]) {
      const rule = rulesRef.current[key];
      const message = rule?.(values[key], values);
      if (message) next[key] = message;
    }
    return next;
    // Rules are read through a ref; recompute when values change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, rules]);

  const serverErrorFor = useCallback(
    (name: keyof V) => {
      const message = serverErrors.errors[name as string];
      // A server error is stale once the user edits that field.
      if (!message || !Object.is(serverErrors.snapshot[name], values[name])) return undefined;
      return message;
    },
    [serverErrors, values],
  );

  const errorFor = useCallback(
    (name: keyof V): string | undefined => {
      if (!(submitted || touched[name])) return serverErrorFor(name);
      return errors[name] ?? serverErrorFor(name);
    },
    [errors, serverErrorFor, submitted, touched],
  );

  const fieldKey = (name: keyof V) => `${formId}:${String(name)}`;
  const errorId = (name: keyof V) => `${formId}-${String(name)}-error`;

  const touch = useCallback((name: keyof V) => {
    setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
  }, []);

  /** Spread onto the input: wires blur-to-validate and ARIA error association. */
  const fieldProps = (name: keyof V) => {
    const message = errorFor(name);
    return {
      "data-validate-field": fieldKey(name),
      onBlur: () => touch(name),
      "aria-invalid": message ? true : undefined,
      "aria-describedby": message ? errorId(name) : undefined,
    } as const;
  };

  const focusField = (name: keyof V) => {
    if (typeof document === "undefined") return;
    const el = document.querySelector<HTMLElement>(`[data-validate-field="${CSS.escape(fieldKey(name))}"]`);
    if (el) {
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  };

  /** Reveals all errors; returns true when the form is valid, otherwise focuses the first invalid field. */
  const validateAll = (): boolean => {
    setSubmitted(true);
    const invalid = (Object.keys(rulesRef.current) as (keyof V)[]).filter((key) => errors[key]);
    if (invalid.length > 0) {
      // Defer so the error markup is rendered before focus moves.
      setTimeout(() => focusField(invalid[0]), 0);
      return false;
    }
    return true;
  };

  /** Validates only the given fields (multi-step forms); reveals and focuses their errors. */
  const validateFields = (names: (keyof V)[]): boolean => {
    setTouched((prev) => {
      const next = { ...prev };
      for (const name of names) next[name] = true;
      return next;
    });
    const firstInvalid = names.find((name) => errors[name]);
    if (firstInvalid !== undefined) {
      setTimeout(() => focusField(firstInvalid), 0);
      return false;
    }
    return true;
  };

  const setServerErrors = (fieldErrors: Record<string, string> | undefined | null) => {
    const errorsMap = fieldErrors ?? {};
    setServerErrorsState({ errors: errorsMap, snapshot: { ...values } });
    const first = Object.keys(errorsMap).find((key) => key in values) as keyof V | undefined;
    if (first !== undefined) setTimeout(() => focusField(first), 0);
  };

  const reset = () => {
    setTouched({});
    setSubmitted(false);
    setServerErrorsState({ errors: {}, snapshot: {} });
  };

  const isValid = Object.keys(errors).length === 0;

  return { errors, errorFor, errorId, fieldProps, touch, validateAll, validateFields, setServerErrors, reset, isValid, submitted };
}

export type FormValidation<V extends Record<string, unknown>> = ReturnType<typeof useFormValidation<V>>;
