import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { IrisOperationsService } from "@/lib/services/iris";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request);
    if (!("userId" in auth)) {
      return auth as Response;
    }

    if (auth.userRole !== "landlord") {
      return NextResponse.json(
        { error: "Forbidden: Landlord role required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId") ?? undefined;

    if (propertyId) {
      const owns = await IrisOperationsService.verifyLandlordPropertyOwnership(
        auth.supabase,
        auth.userId,
        propertyId
      );
      if (!owns) {
        return NextResponse.json(
          { error: "Property not found or unauthorized" },
          { status: 404 }
        );
      }
    }

    const context = await IrisOperationsService.getLandlordOperationalContext(
      auth.supabase,
      auth.userId,
      propertyId
    );

    return NextResponse.json({ data: context });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
