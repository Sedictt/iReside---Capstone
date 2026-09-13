import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
    const cookieStore = await cookies();
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const response = NextResponse.json({ ok: true });

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

    response.cookies.delete("x-user-role");
    response.cookies.set("x-user-role", "", {
        path: "/",
        maxAge: 0,
        expires: new Date(0),
        sameSite: "lax",
    });

    return response;
}
