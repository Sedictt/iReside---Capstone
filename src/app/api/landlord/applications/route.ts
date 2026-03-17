import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/types/database";

type ApplicationResponse = {
    id: string;
    applicant: {
        name: string;
        email: string;
        phone: string;
        occupation: string;
        monthlyIncome: number | null;
        creditScore: number | null;
        avatar: string | null;
    };
    propertyName: string;
    unitNumber: string;
    propertyImage: string;
    requestedMoveIn: string | null;
    monthlyRent: number | null;
    status: ApplicationStatus;
    submittedDate: string;
    notes: string | null;
    documents: string[];
};

const FALLBACK_PROPERTY_IMAGE =
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&auto=format&fit=crop&q=80";

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

export async function GET() {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: applicationRows, error: applicationsError } = await supabase
        .from("applications")
        .select(
            "id, status, message, monthly_income, employment_status, move_in_date, documents, created_at, applicant_id, unit_id"
        )
        .eq("landlord_id", user.id)
        .order("created_at", { ascending: false });

    if (applicationsError) {
        return NextResponse.json({ error: "Failed to load applications." }, { status: 500 });
    }

    if (!applicationRows || applicationRows.length === 0) {
        return NextResponse.json({ applications: [] satisfies ApplicationResponse[] });
    }

    const applicantIds = Array.from(
        new Set(applicationRows.map((row) => row.applicant_id).filter((value): value is string => Boolean(value)))
    );
    const unitIds = Array.from(
        new Set(applicationRows.map((row) => row.unit_id).filter((value): value is string => Boolean(value)))
    );

    const { data: applicantRows, error: applicantsError } =
        applicantIds.length > 0
            ? await supabase
                  .from("profiles")
                  .select("id, full_name, email, phone, avatar_url")
                  .in("id", applicantIds)
            : { data: [], error: null };

    if (applicantsError) {
        return NextResponse.json({ error: "Failed to load applicant profiles." }, { status: 500 });
    }

    const { data: unitRows, error: unitsError } =
        unitIds.length > 0
            ? await supabase
                  .from("units")
                  .select("id, name, rent_amount, property_id")
                  .in("id", unitIds)
            : { data: [], error: null };

    if (unitsError) {
        return NextResponse.json({ error: "Failed to load units." }, { status: 500 });
    }

    const propertyIds = Array.from(
        new Set((unitRows ?? []).map((row) => row.property_id).filter((value): value is string => Boolean(value)))
    );

    const { data: propertyRows, error: propertiesError } =
        propertyIds.length > 0
            ? await supabase.from("properties").select("id, name, images").in("id", propertyIds)
            : { data: [], error: null };

    if (propertiesError) {
        return NextResponse.json({ error: "Failed to load properties." }, { status: 500 });
    }

    const applicantMap = new Map((applicantRows ?? []).map((row) => [row.id, row]));
    const unitMap = new Map((unitRows ?? []).map((row) => [row.id, row]));
    const propertyMap = new Map((propertyRows ?? []).map((row) => [row.id, row]));

    const applications: ApplicationResponse[] = applicationRows.map((row) => {
        const applicant = applicantMap.get(row.applicant_id);
        const unit = unitMap.get(row.unit_id);
        const property = unit ? propertyMap.get(unit.property_id) : null;
        const propertyImages = property?.images;
        const propertyImage =
            Array.isArray(propertyImages) && isNonEmptyString(propertyImages[0])
                ? propertyImages[0]
                : FALLBACK_PROPERTY_IMAGE;

        return {
            id: row.id,
            applicant: {
                name: applicant?.full_name ?? "Unknown applicant",
                email: applicant?.email ?? "Not provided",
                phone: applicant?.phone ?? "Not provided",
                occupation: row.employment_status ?? "Not provided",
                monthlyIncome: row.monthly_income ?? null,
                creditScore: null,
                avatar: applicant?.avatar_url ?? null,
            },
            propertyName: property?.name ?? unit?.name ?? "Property",
            unitNumber: unit?.name ?? "Unit",
            propertyImage,
            requestedMoveIn: row.move_in_date ?? null,
            monthlyRent: unit?.rent_amount ?? null,
            status: row.status,
            submittedDate: row.created_at,
            notes: row.message ?? null,
            documents: Array.isArray(row.documents)
                ? row.documents.filter((doc): doc is string => isNonEmptyString(doc))
                : [],
        };
    });

    return NextResponse.json({ applications });
}
