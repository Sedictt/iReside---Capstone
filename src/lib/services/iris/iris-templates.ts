export type IrisTemplateKey =
  | "payment_gentle"
  | "payment_overdue"
  | "lease_renewal"
  | "maintenance_advisory"
  | "general_notice";

export interface TemplateContext {
  tenant_name?: string;
  unit?: string;
  property_name?: string;
  amount?: string;
  due_date?: string;
  days_overdue?: string;
  lease_end_date?: string;
  billing_period?: string;
  maintenance_date?: string;
  custom_message?: string;
  [key: string]: string | undefined;
}

export const IRIS_TEMPLATES: Record<IrisTemplateKey, string> = {
  payment_gentle:
    "Dear {tenant_name}, this is a gentle reminder that your rent of {amount} for {unit} at {property_name} is due on {due_date}. Thank you for your prompt settlement!",
  payment_overdue:
    "URGENT NOTICE: Dear {tenant_name}, rent payment of {amount} for {unit} at {property_name} is overdue by {days_overdue} days (originally due {due_date}). Please settle your balance immediately to avoid penalties.",
  lease_renewal:
    "Hello {tenant_name}, your lease for {unit} at {property_name} is scheduled to end on {lease_end_date}. Please let management know if you wish to renew your lease agreement.",
  maintenance_advisory:
    "Maintenance Advisory for {property_name} ({unit}): Scheduled maintenance will be conducted on {maintenance_date}. Details: {custom_message}",
  general_notice:
    "Notice to residents of {property_name}: {custom_message}",
};

export const DEFAULT_FALLBACKS: Record<string, string> = {
  tenant_name: "Valued Resident",
  unit: "your unit",
  property_name: "the property",
  amount: "₱0.00",
  due_date: "the due date",
  days_overdue: "0",
  lease_end_date: "end of term",
  billing_period: "current period",
  maintenance_date: "scheduled date",
  custom_message: "Please contact management for additional details.",
};

export const TEMPLATE_REQUIRED_TOKENS: Record<IrisTemplateKey, readonly string[]> = {
  payment_gentle: ["tenant_name", "amount", "unit", "property_name", "due_date"],
  payment_overdue: ["tenant_name", "amount", "unit", "property_name", "days_overdue", "due_date"],
  lease_renewal: ["tenant_name", "unit", "property_name", "lease_end_date"],
  maintenance_advisory: ["property_name", "unit", "maintenance_date"],
  general_notice: ["property_name", "custom_message"],
};

/**
 * Sanitizes template input values to prevent HTML injection, XSS attacks,
 * and dangerous script execution in notifications or chat views.
 */
export function sanitizeTemplateInput(input: unknown): string {
  if (input === null || input === undefined) {
    return "";
  }
  const str = String(input);

  // Strip html tags: <script ...>...</script>, <style ...>...</style>, etc.
  const tagStripped = str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<\/?[^>]+(>|$)/gi, "")
    // Remove javascript: pseudo-protocol
    .replace(/javascript:/gi, "")
    // Neutralize dangerous inline event handlers like onerror=, onload=, onclick=
    .replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .trim();

  return tagStripped;
}

/**
 * Validates whether all required tokens for a given template exist in the context.
 */
export function validateTemplateContext(
  templateKey: IrisTemplateKey,
  context: TemplateContext
): { valid: boolean; missingTokens: string[] } {
  const required = TEMPLATE_REQUIRED_TOKENS[templateKey] ?? [];
  const missingTokens: string[] = [];

  for (const token of required) {
    const val = Object.prototype.hasOwnProperty.call(context, token)
      ? context[token]
      : undefined;
    if (val === undefined || val === null || String(val).trim() === "") {
      missingTokens.push(token);
    }
  }

  return {
    valid: missingTokens.length === 0,
    missingTokens,
  };
}

/**
 * Replaces tokens in the form of {token_name} with sanitized values from context.
 * If a token is not provided in context, it falls back to DEFAULT_FALLBACKS or a custom fallback string.
 */
export function renderTemplate(
  templateKeyOrText: IrisTemplateKey | string,
  context: TemplateContext = {},
  options?: {
    strict?: boolean; // if true, throws error on missing required token
    customFallback?: string;
  }
): string {
  const template =
    templateKeyOrText in IRIS_TEMPLATES
      ? IRIS_TEMPLATES[templateKeyOrText as IrisTemplateKey]
      : templateKeyOrText;

  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, key: string) => {
    const hasOwnProp = Object.prototype.hasOwnProperty.call(context, key);
    const rawVal = hasOwnProp ? context[key] : undefined;

    if (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== "") {
      return sanitizeTemplateInput(rawVal);
    }

    if (options?.strict) {
      throw new Error(`Missing required template variable: ${key}`);
    }

    if (options?.customFallback !== undefined) {
      return sanitizeTemplateInput(options.customFallback);
    }

    const fallback = Object.prototype.hasOwnProperty.call(DEFAULT_FALLBACKS, key)
      ? DEFAULT_FALLBACKS[key]
      : undefined;

    return fallback ?? `[${key}]`;
  });
}

/**
 * Alias for renderTemplate to ensure backwards compatibility.
 */
export const substituteTemplate = renderTemplate;

/**
 * Returns available template keys.
 */
export function getAvailableTemplateKeys(): IrisTemplateKey[] {
  return Object.keys(IRIS_TEMPLATES) as IrisTemplateKey[];
}
