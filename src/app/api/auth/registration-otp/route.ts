import { NextResponse } from "next/server";
import { sendRegistrationOTP } from "@/lib/email";

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Send the email
        await sendRegistrationOTP({ to: email, otp });

        // For demo/prototype purposes, we return the OTP in the response
        // In a production app, you would store this in Redis/Database with an expiry
        return NextResponse.json({ success: true, otp });
    } catch (error) {
        console.error("Error sending registration OTP:", error);
        return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
    }
}
