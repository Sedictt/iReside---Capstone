import crypto from "crypto";
import { NextResponse } from "next/server";
import { sendRegistrationOTP } from "@/lib/email";
import { parseJsonBody } from "@/lib/validation/server";
import { registrationOtpSchema } from "@/lib/validation/schemas/account.schema";

export async function POST(request: Request) {
    try {
        const parsed = await parseJsonBody(request, registrationOtpSchema);
        if (!parsed.ok) return parsed.response;
        const { email } = parsed.data;

        // Generate a 6-digit OTP
        const otp = crypto.randomInt(100000, 1000000).toString();

        // Send the email
        await sendRegistrationOTP({ to: email, otp });

        // Never return the code to the caller: anyone could "verify" any address.
        // (This legacy endpoint only backs the deprecated landlord signup.)
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error sending registration OTP:", error);
        return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
    }
}
