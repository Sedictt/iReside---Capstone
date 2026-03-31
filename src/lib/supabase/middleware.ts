import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isGuidedTenantOnboardingEnabled } from "@/lib/onboarding";
import {
    TENANT_PRODUCT_TOUR_ROUTE,
    isGuidedTenantProductTourEnabled,
    resolveTenantProductTourEligibility,
} from "@/lib/product-tour";

export const TENANT_ONBOARDING_ROUTE_PREFIX = "/tenant/onboarding";
export const TENANT_PRODUCT_TOUR_ROUTE_PREFIX = TENANT_PRODUCT_TOUR_ROUTE;
const TENANT_ROUTE_ALLOWLIST_DURING_ONBOARDING = ["/tenant/onboarding", "/tenant/sign-lease", "/tenant/support"];
const TENANT_API_WRITE_ALLOWLIST_DURING_ONBOARDING = ["/api/tenant/onboarding"];
export const TENANT_LEASE_SIGN_API_PATTERN = /^\/api\/tenant\/leases\/[^/]+\/sign$/;
const TOUR_AUTO_START_ROUTE_PREFIXES = [
    "/tenant/community",
    "/tenant/dashboard",
    "/tenant/lease",
    "/tenant/payments",
    "/tenant/messages",
];

export const isTenantApiWriteRequest = (request: NextRequest) => {
    if (!request.nextUrl.pathname.startsWith("/api/tenant/")) return false;
    const method = request.method.toUpperCase();
    return !["GET", "HEAD", "OPTIONS"].includes(method);
};

export const isAllowlistedTenantWritePath = (pathname: string) =>
    TENANT_API_WRITE_ALLOWLIST_DURING_ONBOARDING.some((prefix) => pathname.startsWith(prefix)) ||
    TENANT_LEASE_SIGN_API_PATTERN.test(pathname);

export const isAllowlistedTenantRoute = (pathname: string) =>
    TENANT_ROUTE_ALLOWLIST_DURING_ONBOARDING.some((prefix) => pathname.startsWith(prefix));

const resolveRole = async (supabase: any, user: any): Promise<string> => {
    const metadataRole = user?.user_metadata?.role;
    if (typeof metadataRole === "string" && metadataRole.length > 0) {
        return metadataRole;
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    return profile?.role ?? "tenant";
};

const resolveTenantNeedsOnboarding = async (supabase: any, user: any, role: string) => {
    if (!isGuidedTenantOnboardingEnabled()) return false;
    if (!user || role !== "tenant") return false;

    const { data, error } = await (supabase as any)
        .from("tenant_onboarding_states")
        .select("status")
        .eq("tenant_id", user.id)
        .maybeSingle();

    if (error) {
        // Fail open for middleware route access. API-level checks still protect writes.
        console.warn("[middleware] onboarding state lookup failed:", error.message);
        return false;
    }

    return !data || data.status !== "completed";
};

const buildOnboardingRedirect = (request: NextRequest) => {
    const url = request.nextUrl.clone();
    const destination = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    url.pathname = TENANT_ONBOARDING_ROUTE_PREFIX;
    url.search = "";
    url.searchParams.set("next", destination);
    return url;
};

const resolveOnboardingExitDestination = (request: NextRequest) => {
    const requestedNext = request.nextUrl.searchParams.get("next");
    if (requestedNext && requestedNext.startsWith("/tenant/") && !requestedNext.startsWith("/tenant/onboarding")) {
        return requestedNext;
    }
    return "/tenant/community";
};

const isOnboardingPreviewRequest = (request: NextRequest) =>
    request.nextUrl.pathname.startsWith(TENANT_ONBOARDING_ROUTE_PREFIX) &&
    ["1", "true", "yes"].includes((request.nextUrl.searchParams.get("preview") ?? "").toLowerCase());

const isTourAutoStartRoute = (pathname: string) =>
    TOUR_AUTO_START_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

const resolveTenantTourRedirectSource = (reason: string) => {
    if (reason === "eligible_resume") return "resume";
    if (reason === "eligible_reprompt") return "resume";
    return "auto_portal_entry";
};

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
                },
            },
        }
    );

    // IMPORTANT: DO NOT REMOVE auth.getUser()
    // This refreshes the session token if expired.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    let role: string | null = null;
    if (user) {
        role = await resolveRole(supabase as any, user);
    }

    const tenantNeedsOnboarding = await resolveTenantNeedsOnboarding(supabase as any, user, role ?? "");

    // Let API route handlers return structured JSON auth errors (401/403),
    // but enforce tenant onboarding write gate for non-allowlisted writes.
    if (request.nextUrl.pathname.startsWith("/api")) {
        if (user && role === "tenant" && tenantNeedsOnboarding && isTenantApiWriteRequest(request)) {
            const pathname = request.nextUrl.pathname;
            if (!isAllowlistedTenantWritePath(pathname)) {
                return NextResponse.json(
                    {
                        error: "Complete onboarding before performing this action.",
                        code: "ONBOARDING_REQUIRED",
                    },
                    { status: 403 }
                );
            }
        }
        return supabaseResponse;
    }

    // Protect /admin routes - only allow users with admin role.
    if (request.nextUrl.pathname.startsWith("/admin")) {
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = "/login";
            return NextResponse.redirect(url);
        }
        if (role !== "admin") {
            const url = request.nextUrl.clone();
            url.pathname = role === "landlord" ? "/landlord/dashboard" : "/tenant/community";
            return NextResponse.redirect(url);
        }
    }

    // If user is already logged in, prevent them from accessing auth pages.
    if (user && (request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup"))) {
        const url = request.nextUrl.clone();
        if (role === "admin") url.pathname = "/admin/dashboard";
        else if (role === "landlord") url.pathname = "/landlord/dashboard";
        else if (tenantNeedsOnboarding) url.pathname = TENANT_ONBOARDING_ROUTE_PREFIX;
        else url.pathname = "/tenant/community";
        return NextResponse.redirect(url);
    }

    // If user is not signed in and the current path is not /login, /signup, or /auth, redirect to /login.
    if (
        !user &&
        !request.nextUrl.pathname.startsWith("/login") &&
        !request.nextUrl.pathname.startsWith("/signup") &&
        !request.nextUrl.pathname.startsWith("/auth")
    ) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // Tenant onboarding route gating.
    if (user && role === "tenant" && tenantNeedsOnboarding) {
        const pathname = request.nextUrl.pathname;
        const isTenantRoute = pathname.startsWith("/tenant/");
        if (isTenantRoute && !isAllowlistedTenantRoute(pathname)) {
            return NextResponse.redirect(buildOnboardingRedirect(request));
        }
    }

    // Prevent completed tenants from revisiting onboarding route.
    if (
        user &&
        role === "tenant" &&
        !tenantNeedsOnboarding &&
        request.nextUrl.pathname.startsWith(TENANT_ONBOARDING_ROUTE_PREFIX) &&
        !isOnboardingPreviewRequest(request)
    ) {
        const url = request.nextUrl.clone();
        url.pathname = resolveOnboardingExitDestination(request);
        url.search = "";
        return NextResponse.redirect(url);
    }

    if (
        user &&
        role === "tenant" &&
        !tenantNeedsOnboarding &&
        isGuidedTenantProductTourEnabled() &&
        request.nextUrl.pathname.startsWith("/tenant/") &&
        !request.nextUrl.pathname.startsWith(TENANT_PRODUCT_TOUR_ROUTE_PREFIX) &&
        isTourAutoStartRoute(request.nextUrl.pathname)
    ) {
        try {
            const eligibility = await resolveTenantProductTourEligibility(supabase as any, {
                tenantId: user.id,
                role,
                onboardingCompleted: true,
            });

            if (eligibility.eligible) {
                const url = request.nextUrl.clone();
                url.pathname = TENANT_PRODUCT_TOUR_ROUTE_PREFIX;
                url.search = "";
                url.searchParams.set("source", resolveTenantTourRedirectSource(eligibility.reason));
                return NextResponse.redirect(url);
            }
        } catch (error) {
            console.warn("[middleware] product tour eligibility lookup failed:", error);
        }
    }

    // Add cache-control headers to prevent back-button access to protected pages.
    if (user && supabaseResponse.headers instanceof Headers) {
        supabaseResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        supabaseResponse.headers.set("Pragma", "no-cache");
        supabaseResponse.headers.set("Expires", "0");
    }

    return supabaseResponse;
}
