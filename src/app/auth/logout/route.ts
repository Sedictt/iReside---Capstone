import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

async function handleLogout(request: Request) {
    const cookieStore = await cookies();

    try {
        const supabase = await createClient();
        await supabase.auth.signOut();
    } catch (e) {
        console.warn("[AuthLogout] Error signing out from Supabase:", e);
    }

    const loginUrl = new URL("/login", request.url);
    const logoutToken = new URL(request.url).searchParams.get("logout") || String(Date.now());
    loginUrl.searchParams.set("logout", logoutToken);

    const response = NextResponse.redirect(loginUrl);

    // Prevent caching of this logout redirect
    response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    // Explicitly wipe all auth and role cookies on the response
    const allCookies = cookieStore.getAll();
    const isAuthRelatedCookie = (name: string) =>
        name.includes("-auth-token") ||
        name.startsWith("sb-") ||
        name === "supabase-auth-token" ||
        name === "x-user-role" ||
        name.includes("session");

    for (const cookie of allCookies) {
        if (isAuthRelatedCookie(cookie.name)) {
            response.cookies.delete(cookie.name);
            response.cookies.set(cookie.name, "", {
                path: "/",
                maxAge: 0,
                expires: new Date(0),
                sameSite: "lax",
            });
        }
    }

    // Also explicitly ensure x-user-role is expunged
    response.cookies.delete("x-user-role");
    response.cookies.set("x-user-role", "", {
        path: "/",
        maxAge: 0,
        expires: new Date(0),
        sameSite: "lax",
    });

    return response;
}

export async function GET(request: Request) {
    return handleLogout(request);
}

export async function POST(request: Request) {
    return handleLogout(request);
}
