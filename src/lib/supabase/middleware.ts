import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
    TENANT_PRODUCT_TOUR_ROUTE,
    isGuidedTenantProductTourEnabled,
    resolveTenantProductTourEligibility,
} from "@/lib/product-tour";

export const TENANT_PRODUCT_TOUR_ROUTE_PREFIX = TENANT_PRODUCT_TOUR_ROUTE;
const TOUR_AUTO_START_ROUTE_PREFIXES = [
    "/tenant/community",
    "/tenant/dashboard",
    "/tenant/lease",
    "/tenant/payments",
    "/tenant/messages",
];

const resolveRole = async (supabase: any, user: any): Promise<string> => {
    const metadataRole = user?.user_metadata?.role;
    if (typeof metadataRole === "string" && metadataRole.length > 0) {
        return metadataRole;
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    return profile?.role ?? "tenant";
};

const isTourAutoStartRoute = (pathname: string) =>
    TOUR_AUTO_START_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

const PUBLIC_ROUTE_PREFIXES = ["/login", "/signup", "/auth", "/apply", "/apply-landlord", "/demo", "/sign"];
const PUBLIC_EXACT_ROUTES = ["/"];

const isPublicRoute = (pathname: string) =>
    PUBLIC_EXACT_ROUTES.includes(pathname) ||
    PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

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

    // Let API route handlers return structured JSON auth errors (401/403).
    if (request.nextUrl.pathname.startsWith("/api")) {
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
        else url.pathname = "/tenant/community";
        return NextResponse.redirect(url);
    }

    // If user is not signed in and the current path is not /login, /signup, or /auth, redirect to /login.
    if (!user && !isPublicRoute(request.nextUrl.pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    if (
        user &&
        role === "tenant" &&
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

export const isAllowlistedTenantRoute = (pathname: string) =>
    pathname.startsWith("/tenant/onboarding") || pathname.startsWith("/tenant/sign-lease/");

export const isAllowlistedTenantWritePath = (pathname: string) =>
    pathname.startsWith("/api/tenant/onboarding/") || !!pathname.match(/\/api\/tenant\/leases\/[^/]+\/sign/);

export const isTenantApiWriteRequest = (request: NextRequest) =>
    request.nextUrl.pathname.startsWith("/api/tenant/") && ["POST", "PATCH", "PUT", "DELETE"].includes(request.method);
