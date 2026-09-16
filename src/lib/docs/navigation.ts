export interface DocsBackLinkOptions {
  defaultBackHref?: string;
  pathname?: string | null;
  userRole?: string | null;
}

export interface DocsBackLinkResult {
  href: string;
  label: string;
}

/**
 * Resolves the destination URL and display label for the documentation return button.
 *
 * CRITICAL ARCHITECTURAL RULE:
 * The manual reading audience (tenant vs landlord vs it) MUST NEVER determine where
 * the return button routes. A landlord browsing the tenant manual must always return
 * to their landlord portal, and a tenant browsing the landlord manual must always return
 * to their tenant portal.
 */
export function resolveDocsBackLink(options: DocsBackLinkOptions): DocsBackLinkResult {
  const { defaultBackHref, pathname, userRole } = options;

  let href: string;

  if (defaultBackHref && defaultBackHref.trim().length > 0) {
    href = defaultBackHref.trim();
  } else if (pathname?.startsWith("/tenant")) {
    href = "/tenant/dashboard";
  } else if (pathname?.startsWith("/landlord")) {
    href = "/landlord/dashboard";
  } else if (pathname?.startsWith("/admin")) {
    href = "/admin/dashboard";
  } else if (userRole === "tenant") {
    href = "/tenant/dashboard";
  } else if (userRole === "landlord" || userRole === "admin") {
    href = "/landlord/dashboard";
  } else {
    href = "/";
  }

  let label: string;
  if (href.startsWith("/tenant")) {
    label = "Back to Resident Portal";
  } else if (href.startsWith("/landlord")) {
    label = "Back to Landlord Dashboard";
  } else if (href.startsWith("/admin")) {
    label = "Back to Admin Console";
  } else if (href === "/") {
    label = "Back to Home";
  } else {
    label = "Back to Dashboard";
  }

  return { href, label };
}
