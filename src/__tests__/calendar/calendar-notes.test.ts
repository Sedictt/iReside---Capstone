import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCalendarNotes } from "@/hooks/useCalendarNotes";

describe("useCalendarNotes Hook", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ notes: [] }),
        } as any);
    });

    it("initializes with empty notes if nothing is stored in localStorage", async () => {
        let result: any;
        await act(async () => {
            const hook = renderHook(() => useCalendarNotes({ landlordId: "landlord-123" }));
            result = hook.result;
        });

        expect(result.current.notes).toEqual([]);
    });

    it("loads existing notes from localStorage", async () => {
        const storedNotes = [
            {
                id: "note-1",
                date: "2026-09-25",
                title: "Aircon Cleaning",
                description: "Clean filter in Unit 201",
                created_at: "2026-09-18T10:00:00.000Z",
            },
        ];
        localStorage.setItem("ireside_calendar_notes_landlord-123", JSON.stringify(storedNotes));

        let result: any;
        await act(async () => {
            const hook = renderHook(() => useCalendarNotes({ landlordId: "landlord-123" }));
            result = hook.result;
        });

        expect(result.current.notes).toHaveLength(1);
        expect(result.current.notes[0].title).toBe("Aircon Cleaning");
        expect(result.current.notes[0].date).toBe("2026-09-25");
    });

    it("adds a new note and persists it to localStorage", async () => {
        let result: any;
        await act(async () => {
            const hook = renderHook(() => useCalendarNotes({ landlordId: "landlord-123" }));
            result = hook.result;
        });

        let addResult: any;
        await act(async () => {
            addResult = await result.current.addNote("2026-09-30", "Rent Follow Up", "Check with John on bank transfer");
        });

        expect(addResult.success).toBe(true);
        expect(addResult.note.title).toBe("Rent Follow Up");
        expect(result.current.notes).toHaveLength(1);
        expect(result.current.notes[0].title).toBe("Rent Follow Up");

        // Verify localStorage
        const stored = JSON.parse(localStorage.getItem("ireside_calendar_notes_landlord-123") || "[]");
        expect(stored).toHaveLength(1);
        expect(stored[0].title).toBe("Rent Follow Up");
    });

    it("rejects adding a note without a title", async () => {
        let result: any;
        await act(async () => {
            const hook = renderHook(() => useCalendarNotes({ landlordId: "landlord-123" }));
            result = hook.result;
        });

        let addResult: any;
        await act(async () => {
            addResult = await result.current.addNote("2026-09-30", "   ");
        });

        expect(addResult.success).toBe(false);
        expect(addResult.error).toContain("Title is required");
        expect(result.current.notes).toHaveLength(0);
    });

    it("deletes a note by id and updates localStorage", async () => {
        let result: any;
        await act(async () => {
            const hook = renderHook(() => useCalendarNotes({ landlordId: "landlord-123" }));
            result = hook.result;
        });

        let noteId: string = "";
        await act(async () => {
            const res = await result.current.addNote("2026-10-01", "Meeting with Painter");
            noteId = res.note.id;
        });

        expect(result.current.notes).toHaveLength(1);

        await act(async () => {
            await result.current.deleteNote(noteId);
        });

        expect(result.current.notes).toHaveLength(0);
        const stored = JSON.parse(localStorage.getItem("ireside_calendar_notes_landlord-123") || "[]");
        expect(stored).toHaveLength(0);
    });
});
