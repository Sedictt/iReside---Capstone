import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { data: applicationsData, error: appError } = await supabase
            .from("applications")
            .select(`
                id,
                status,
                documents,
                created_at,
                unit:units!inner (
                    id,
                    name,
                    rent_amount,
                    property:properties!inner (
                        id,
                        name,
                        address,
                        city,
                        type,
                        images
                    )
                )
            `)
            .eq("applicant_id", user.id)
            .order("created_at", { ascending: false });

        if (appError) throw appError;

        const { data: savedData, error: savedError } = await supabase
            .from("saved_properties")
            .select(`
                id,
                property:properties!inner (
                    id, name, address, images, type,
                    units ( rent_amount )
                )
            `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(3);

        if (savedError) throw savedError;

        const { data: activityRows, error: activityError } = await supabase
            .from("notifications")
            .select("id, type, title, message, read, created_at")
            .eq("user_id", user.id)
            .in("type", ["application", "lease", "message"])
            .order("created_at", { ascending: false })
            .limit(5);

        if (activityError) throw activityError;

        return NextResponse.json({
            applications: applicationsData,
            savedProperties: savedData,
            recentActivity: activityRows
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
