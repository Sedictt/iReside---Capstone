import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";

export const dynamic = "force-dynamic";

export interface CalendarNoteRecord {
    id: string;
    date: string; // YYYY-MM-DD
    title: string;
    description?: string;
    created_at: string;
}

export async function GET(request: Request) {
    try {
        const authContext = await requireAuthenticatedUser(request);
        if (!("userId" in authContext)) return authContext as Response;
        const { userId, supabase } = authContext;

        const { data: profile, error } = await supabase
            .from("profiles")
            .select("socials")
            .eq("id", userId)
            .single();

        if (error) {
            console.error("[GET /api/landlord/calendar/notes] Profile fetch error:", error);
            return NextResponse.json({ notes: [] });
        }

        const socials = profile?.socials as Record<string, any> | null;
        const notes = Array.isArray(socials?.calendar_notes) ? socials.calendar_notes : [];

        return NextResponse.json(
            { notes },
            { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
        );
    } catch (err: any) {
        console.error("[GET /api/landlord/calendar/notes] Unexpected error:", err);
        return NextResponse.json({ error: "Failed to fetch calendar notes", notes: [] }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const authContext = await requireAuthenticatedUser(request);
        if (!("userId" in authContext)) return authContext as Response;
        const { userId, supabase } = authContext;

        const body = await request.json();
        const { id, date, title, description } = body;

        if (!date || typeof date !== "string") {
            return NextResponse.json({ error: "Date is required." }, { status: 400 });
        }
        if (!title || typeof title !== "string" || !title.trim()) {
            return NextResponse.json({ error: "Note title is required." }, { status: 400 });
        }

        // Fetch current profile socials
        const { data: profile } = await supabase
            .from("profiles")
            .select("socials")
            .eq("id", userId)
            .single();

        const socials = (profile?.socials as Record<string, any>) || {};
        const existingNotes: CalendarNoteRecord[] = Array.isArray(socials.calendar_notes)
            ? socials.calendar_notes
            : [];

        const noteId = id || `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const noteIndex = existingNotes.findIndex((n) => n.id === noteId);

        const newNote: CalendarNoteRecord = {
            id: noteId,
            date: date.trim(),
            title: title.trim(),
            description: typeof description === "string" ? description.trim() : "",
            created_at: noteIndex >= 0 ? existingNotes[noteIndex].created_at : new Date().toISOString(),
        };

        let updatedNotes: CalendarNoteRecord[];
        if (noteIndex >= 0) {
            updatedNotes = [...existingNotes];
            updatedNotes[noteIndex] = newNote;
        } else {
            updatedNotes = [newNote, ...existingNotes];
        }

        const updatedSocials = {
            ...socials,
            calendar_notes: updatedNotes,
        };

        const { error: updateError } = await (supabase as any)
            .from("profiles")
            .update({ socials: updatedSocials })
            .eq("id", userId);

        if (updateError) {
            console.error("[POST /api/landlord/calendar/notes] Update error:", updateError);
            return NextResponse.json({ error: "Failed to save note." }, { status: 500 });
        }

        return NextResponse.json({ success: true, note: newNote, notes: updatedNotes });
    } catch (err: any) {
        console.error("[POST /api/landlord/calendar/notes] Unexpected error:", err);
        return NextResponse.json({ error: "Failed to save note." }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const authContext = await requireAuthenticatedUser(request);
        if (!("userId" in authContext)) return authContext as Response;
        const { userId, supabase } = authContext;

        const { searchParams } = new URL(request.url);
        const noteId = searchParams.get("id");

        if (!noteId) {
            return NextResponse.json({ error: "Note ID is required." }, { status: 400 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("socials")
            .eq("id", userId)
            .single();

        const socials = (profile?.socials as Record<string, any>) || {};
        const existingNotes: CalendarNoteRecord[] = Array.isArray(socials.calendar_notes)
            ? socials.calendar_notes
            : [];

        const updatedNotes = existingNotes.filter((n) => n.id !== noteId);

        const updatedSocials = {
            ...socials,
            calendar_notes: updatedNotes,
        };

        const { error: updateError } = await (supabase as any)
            .from("profiles")
            .update({ socials: updatedSocials })
            .eq("id", userId);

        if (updateError) {
            console.error("[DELETE /api/landlord/calendar/notes] Delete error:", updateError);
            return NextResponse.json({ error: "Failed to delete note." }, { status: 500 });
        }

        return NextResponse.json({ success: true, notes: updatedNotes });
    } catch (err: any) {
        console.error("[DELETE /api/landlord/calendar/notes] Unexpected error:", err);
        return NextResponse.json({ error: "Failed to delete note." }, { status: 500 });
    }
}
