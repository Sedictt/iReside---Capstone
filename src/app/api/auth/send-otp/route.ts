import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // 1. Generate 6-digit code
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // 2. Initialize Supabase Admin (using service role to bypass RLS)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 2b. Check if user already exists in Supabase Auth
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
            console.error("Error listing users:", listError);
        } else {
            const userExists = users.some(u => u.email?.toLowerCase() === email.trim().toLowerCase());
            if (userExists) {
                return NextResponse.json({ error: "This email has already been registered" }, { status: 400 });
            }
        }

        // 3. Store code in database
        const { error: dbError } = await supabaseAdmin
            .from("verification_codes")
            .insert([
                { 
                    email, 
                    code: otpCode,
                    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
                }
            ]);

        if (dbError) {
            console.error("Database error:", dbError);
            return NextResponse.json({ error: "Failed to store verification code" }, { status: 500 });
        }

        // 4. Configure Nodemailer
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "465"),
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // 5. Send Email
        const mailOptions = {
            from: `"iReside Security" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Your iReside Verification Code",
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #6d9838; text-align: center;">Welcome to iReside!</h2>
                    <p style="font-size: 16px; color: #333;">Please use the following 6-digit code to verify your account. This code will expire in 10 minutes.</p>
                    <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000;">${otpCode}</span>
                    </div>
                    <p style="font-size: 14px; color: #666; text-align: center;">If you didn't request this code, you can safely ignore this email.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #999; text-align: center;">© 2026 iReside Co. All rights reserved.</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true, message: "OTP sent successfully" });

    } catch (error: any) {
        console.error("Send OTP Error:", error);
        return NextResponse.json({ error: error.message || "Failed to send OTP" }, { status: 500 });
    }
}
