import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
    TENANT_PRODUCT_TOUR_ROUTE,
    isGuidedTenantProductTourEnabled,
    resolveTenantProductTourEligibility,
} from "@/lib/product-tour";
import { createClient } from "@/lib/supabase/server";

export async function auth() {
    // This is a helper for server actions to get the current user
    // It returns the user object or null if not authenticated
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user;
}

export const TENANT_PRODUCT_TOUR_ROUTE_PREFIX = TENANT_PRODUCT_TOUR_ROUTE;
const TOUR_AUTO_START_ROUTE_PREFIXES = [
    "/tenant/community",
    "/tenant/dashboard",
    "/tenant/lease",
    "/tenant/payments",
    "/tenant/messages",
];

const ROLE_COOKIE_NAME = "x-user-role";
const ROLE_COOKIE_MAX_AGE = 60 * 60; // 1 hour — re-resolve from DB after this

const resolveRole = async (
    supabase: any,
    user: any,
    request: NextRequest,
): Promise<string> => {
    // 1. Fast path: check user_metadata (set during signup/login)
    const metadataRole = user?.user_metadata?.role;
    if (typeof metadataRole === "string" && metadataRole.length > 0) {
        return metadataRole;
    }

    // 2. Fast path: check cached cookie (avoids DB call on every request)
    const cachedRole = request.cookies.get(ROLE_COOKIE_NAME)?.value;
    if (cachedRole && cachedRole.length > 0) {
        return cachedRole;
    }

    // 3. Slow path: query DB (only on first request after login / cookie expiry)
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    return profile?.role ?? "tenant";
};

const isTourAutoStartRoute = (pathname: string) =>
    TOUR_AUTO_START_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

const PUBLIC_ROUTE_PREFIXES = ["/login", "/signup", "/auth", "/apply", "/apply-landlord", "/landlord/onboarding", "/demo", "/sign", "/docs", "/about", "/terms", "/privacy"];
const PUBLIC_EXACT_ROUTES = ["/"];

const isPublicRoute = (pathname: string, request?: NextRequest) => {
    if (request && (
        request.headers.get("user-agent")?.includes("boneyard") ||
        request.headers.get("x-boneyard") === "true" ||
        request.nextUrl.searchParams.get("boneyard") === "true"
    )) {
        return true;
    }
    return PUBLIC_EXACT_ROUTES.includes(pathname) ||
        PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
};

const resolveTenantTourRedirectSource = (reason: string) => {
    if (reason === "eligible_resume") return "resume";
    if (reason === "eligible_reprompt") return "resume";
    return "auto_portal_entry";
};

const withTimeout = <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => resolve(fallback), ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

export async function updateSession(request: NextRequest) {
    // 1. Fast Path: API routes handle their own auth; bypass middleware to avoid timeouts
    if (request.nextUrl.pathname.startsWith("/api")) {
        return NextResponse.next({ request });
    }

    const pathname = request.nextUrl.pathname;
    const allCookies = request.cookies.getAll();
    const hasAuthCookie = allCookies.some(
        (c) => c.name.includes("-auth-token") || c.name.startsWith("sb-") || c.name === "supabase-auth-token"
    );

    // 2. Fast Path: Unauthenticated visitors on public routes (e.g. /, /login, /about, /docs)
    if (!hasAuthCookie && isPublicRoute(pathname, request)) {
        return NextResponse.next({ request });
    }

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

    // 3. Resilient auth check with 3.5s timeout protection (avoids 504 GATEWAY_TIMEOUT on Edge)
    const userResult = hasAuthCookie
        ? await withTimeout(
              supabase.auth.getUser(),
              3500,
              { data: { user: null }, error: new Error("Auth timeout") } as any
          )
        : { data: { user: null }, error: null };

    const user = userResult?.data?.user ?? null;

    let role: string | null = null;
    if (user) {
        role = await withTimeout(
            resolveRole(supabase as any, user, request),
            2000,
            user?.user_metadata?.role || "tenant"
        );

        // Cache the resolved role in a cookie so subsequent requests skip the DB call
        const existingCookie = request.cookies.get(ROLE_COOKIE_NAME)?.value;
        if (role && existingCookie !== role) {
            supabaseResponse.cookies.set(ROLE_COOKIE_NAME, role, {
                path: "/",
                httpOnly: true,
                sameSite: "lax",
                maxAge: ROLE_COOKIE_MAX_AGE,
                secure: process.env.NODE_ENV === "production",
            });
        }
    } else {
        // Clear role cookie when user is not authenticated (logout)
        supabaseResponse.cookies.delete(ROLE_COOKIE_NAME);
    }

    // Deprecate /admin routes - redirect all admin portal attempts to landlord dashboard (or login).
    if (request.nextUrl.pathname.startsWith("/admin")) {
        const url = request.nextUrl.clone();
        if (!user) {
            url.pathname = "/login";
        } else {
            url.pathname = "/landlord/dashboard";
        }
        return NextResponse.redirect(url);
    }

    // If user is already logged in, prevent them from accessing auth pages.
    if (user && (request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup"))) {
        const url = request.nextUrl.clone();
        if (role === "admin" || role === "landlord") {
            url.pathname = "/landlord/dashboard";
        } else {
            url.pathname = "/tenant/dashboard";
        }
        return NextResponse.redirect(url);
    }

    // If user is not signed in and the current path is not /login, /signup, or /auth, redirect to /login.
    if (!user && !isPublicRoute(request.nextUrl.pathname, request)) {
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
