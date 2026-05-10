import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";

export async function POST(request: Request) {
    try {
        const { user } = await requireUser();
        const supabase = await createClient();

        const body = await request.json();
        const { category, amount, date_incurred, description, propertyId } = body;

        if (!category || !amount || !date_incurred || !description) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { error } = await supabase.from("expenses").insert({
            landlord_id: user.id,
            property_id: propertyId || null,
            category,
            amount,
            date_incurred,
            description,
        });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to record expense:", error);
        return NextResponse.json(
            { error: "Failed to record expense" },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { user } = await requireUser();
        const supabase = await createClient();

        const { searchParams } = new URL(request.url);
        const propertyId = searchParams.get("propertyId");

        let query = supabase
            .from("expenses")
            .select("*")
            .eq("landlord_id", user.id)
            .order("date_incurred", { ascending: false });

        if (propertyId && propertyId !== "all") {
            query = query.eq("property_id", propertyId);
        }

        const { data: expenses, error } = await query;

        if (error) throw error;

        return NextResponse.json({ expenses });
    } catch (error) {
        console.error("Failed to fetch expenses:", error);
        return NextResponse.json(
            { error: "Failed to fetch expenses" },
            { status: 500 }
        );
    }
}
