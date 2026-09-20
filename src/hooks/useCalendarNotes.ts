"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { CalendarNoteRecord } from "@/app/api/landlord/calendar/notes/route";

const STORAGE_PREFIX = "ireside_calendar_notes_";

function getStorageKey(landlordId?: string | null): string {
    return landlordId ? `${STORAGE_PREFIX}${landlordId}` : `${STORAGE_PREFIX}default`;
}

function readStoredNotes(key: string): CalendarNoteRecord[] {
    if (typeof window === "undefined") return [];
    try {
        const item = window.localStorage.getItem(key);
        if (!item) return [];
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed)) {
            return parsed.filter((n) => n && n.id && n.date && n.title);
        }
    } catch {
        // Ignore parse errors
    }
    return [];
}

function writeStoredNotes(key: string, notes: CalendarNoteRecord[]): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, JSON.stringify(notes));
    } catch {
        // Ignore quota errors
    }
}

export interface UseCalendarNotesOptions {
    landlordId?: string | null;
    userId?: string | null;
    apiEndpoint?: string;
}

export function useCalendarNotes({ landlordId, userId, apiEndpoint }: UseCalendarNotesOptions = {}) {
    const effectiveId = userId || landlordId;
    const targetEndpoint = apiEndpoint || (userId && !landlordId ? "/api/tenant/calendar/notes" : "/api/landlord/calendar/notes");
    const storageKey = useMemo(() => getStorageKey(effectiveId), [effectiveId]);

    const [notes, setNotes] = useState<CalendarNoteRecord[]>(() => {
        return readStoredNotes(storageKey);
    });

    const notesRef = useRef<CalendarNoteRecord[]>(notes);
    notesRef.current = notes;

    const [isLoading, setIsLoading] = useState(false);

    // Synchronize with server
    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchNotes = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(targetEndpoint, {
                    signal: controller.signal,
                });
                if (!res.ok) return;
                const data = await res.json();
                if (!isMounted) return;

                if (Array.isArray(data.notes)) {
                    // Merge server notes with local notes (server + local unique by id)
                    const local = readStoredNotes(storageKey);
                    const map = new Map<string, CalendarNoteRecord>();
                    // Local takes priority for any pending changes
                    for (const n of data.notes) {
                        if (n && n.id) map.set(n.id, n);
                    }
                    for (const n of local) {
                        if (n && n.id) map.set(n.id, n);
                    }
                    for (const n of notesRef.current) {
                        if (n && n.id) map.set(n.id, n);
                    }

                    const merged = Array.from(map.values()).sort(
                        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
                    );

                    notesRef.current = merged;
                    writeStoredNotes(storageKey, merged);
                    setNotes(merged);
                }
            } catch {
                // Ignore network errors/aborts
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        void fetchNotes();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [storageKey]);

    // Add or update a note
    const addNote = useCallback(
        async (date: string, title: string, description?: string): Promise<{ success: boolean; note?: CalendarNoteRecord; error?: string }> => {
            const trimmedTitle = title.trim();
            const trimmedDate = date.trim();

            if (!trimmedDate) {
                return { success: false, error: "Date is required." };
            }
            if (!trimmedTitle) {
                return { success: false, error: "Title is required." };
            }

            const newNote: CalendarNoteRecord = {
                id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                date: trimmedDate,
                title: trimmedTitle,
                description: description?.trim() || "",
                created_at: new Date().toISOString(),
            };

            const updated = [newNote, ...notesRef.current];
            notesRef.current = updated;
            writeStoredNotes(storageKey, updated);
            setNotes(updated);

            // Sync with backend asynchronously
            try {
                fetch(targetEndpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newNote),
                }).catch((err) => console.warn("[useCalendarNotes] Background sync failed:", err));
            } catch {
                // Ignore background sync errors
            }

            return { success: true, note: newNote };
        },
        [storageKey, targetEndpoint]
    );

    // Delete a note
    const deleteNote = useCallback(
        async (id: string): Promise<void> => {
            const updated = notesRef.current.filter((n) => n.id !== id);
            notesRef.current = updated;
            writeStoredNotes(storageKey, updated);
            setNotes(updated);

            // Sync with backend asynchronously
            try {
                fetch(`${targetEndpoint}?id=${encodeURIComponent(id)}`, {
                    method: "DELETE",
                }).catch((err) => console.warn("[useCalendarNotes] Background delete failed:", err));
            } catch {
                // Ignore background sync errors
            }
        },
        [storageKey, targetEndpoint]
    );

    return {
        notes,
        addNote,
        deleteNote,
        isLoading,
    };
}
