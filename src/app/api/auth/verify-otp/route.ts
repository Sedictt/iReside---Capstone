import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
    try {
        const { email, code, userData } = await request.json();

        if (!email || !code) {
            return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Verify code in database
        const { data: verificationEntry, error: fetchError } = await supabaseAdmin
            .from("verification_codes")
            .select("*")
            .eq("email", email)
            .eq("code", code)
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (fetchError || !verificationEntry) {
            return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
        }

        // 2. Code is valid, now create the user in Supabase Auth
        // If userData is provided (for fresh signup), create the user
        if (userData) {
            const { error: signUpError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: userData.password,
                email_confirm: true, // Auto-confirm the email
                user_metadata: {
                    full_name: userData.fullName,
                    role: userData.role,
                }
            });

            if (signUpError) {
                console.error("SignUp Error:", signUpError);
                return NextResponse.json({ error: signUpError.message }, { status: 500 });
            }
        }

        // 3. Clean up the used code
        await supabaseAdmin
            .from("verification_codes")
            .delete()
            .eq("email", email);

        return NextResponse.json({ success: true, message: "Verification successful" });

    } catch (error: any) {
        console.error("Verify OTP Error:", error);
        return NextResponse.json({ error: error.message || "Verification failed" }, { status: 500 });
    }
}
