import { NextResponse } from "next/server";
import { searchValenzuelaBusinessDatabank, generateValenzuelaSearchURL } from "@/lib/business-verification";

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => null);
        const businessName = body?.businessName as string | undefined;

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
