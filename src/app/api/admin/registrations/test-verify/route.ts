import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { searchValenzuelaBusinessDatabank, generateValenzuelaSearchURL } from "@/lib/business-verification";

export async function POST(request: Request) {
    // Outbound lookup tool: admins only.
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { data: profile } = await authContext.supabase
        .from("profiles")
        .select("role")
        .eq("id", authContext.userId)
        .maybeSingle();
    if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await request.json().catch(() => null);
        const rawName = body?.businessName;
        const businessName = typeof rawName === "string" ? rawName.trim() : "";

        if (businessName.length > 250) {
            return NextResponse.json({ error: "Business name cannot exceed 250 characters." }, { status: 400 });
        }

        if (!businessName) {
            return NextResponse.json({ error: "Business name is required." }, { status: 400 });
        }

        const verificationResult = await searchValenzuelaBusinessDatabank(businessName);
        const manualSearchURL = generateValenzuelaSearchURL(businessName);

        return NextResponse.json({
            verification: verificationResult,
            manualSearchURL,
        });
    } catch (error) {
        console.error("Error during test verification:", error);
        return NextResponse.json(
            { error: "Verification failed. Please try again." },
            { status: 500 }
        );
    }
}
