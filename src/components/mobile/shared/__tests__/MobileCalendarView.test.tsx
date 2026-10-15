import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MobileCalendarView } from '../MobileCalendarView';

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}));

// Mock AuthContext
vi.mock('@/context/AuthContext', () => ({
    useAuth: () => ({
        profile: { id: 'user-123', role: 'landlord' },
        user: { id: 'user-123' },
    }),
}));

// Mock PropertyContext
vi.mock('@/context/PropertyContext', () => ({
    useProperty: () => ({
        selectedPropertyId: null,
        properties: [],
    }),
}));

// Mock LanguageContext
vi.mock('@/context/LanguageContext', () => ({
    useLanguageContext: () => ({
        t: (str: string, vars?: any) => {
            if (!vars) return str;
            let res = str;
            Object.keys(vars).forEach(k => {
                res = res.replace(`{${k}}`, vars[k]);
            });
            return res;
        },
        locale: 'en',
    }),
}));

// Mock haptics & notifications
vi.mock('@/lib/haptics', () => ({
    triggerHaptic: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock PullToRefresh
vi.mock('@/components/mobile/shared/PullToRefresh', () => ({
    PullToRefresh: ({ children }: any) => <div>{children}</div>,
}));

// Mock MobilePropertySelector
vi.mock('@/components/mobile/shared/MobilePropertySelector', () => ({
    MobilePropertySelector: () => <div data-testid="mobile-property-selector">PropertySelector</div>,
}));

// Mock useCalendarNotes
const mockAddNote = vi.fn().mockResolvedValue({ success: true, note: { id: 'note-1', title: 'Test Note', date: '2026-10-15' } });
const mockDeleteNote = vi.fn().mockResolvedValue(undefined);
const mockNotes = [
    {
        id: 'note-1',
        title: 'Aircon Cleaning Service',
        description: 'Technician arrives at 10 AM',
        date: new Date().toISOString().split('T')[0],
        created_at: '2026-10-15T00:00:00Z',
    }
];

vi.mock('@/hooks/useCalendarNotes', () => ({
    useCalendarNotes: () => ({
        notes: mockNotes,
        addNote: mockAddNote,
        deleteNote: mockDeleteNote,
        isLoading: false,
    }),
}));

const mockFetch = vi.fn().mockImplementation(() => {
    return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ events: mockEvents }),
    });
});
global.fetch = mockFetch as any;
if (typeof window !== 'undefined') {
    window.fetch = mockFetch as any;
}

const mockEvents = [
    {
        id: 'evt-1',
        title: 'Rent Due - Unit 101',
        date: new Date().toISOString().split('T')[0],
        type: 'payment',
        amount: 15000,
        unitName: '101',
        propertyName: 'Skyline Residences',
    },
    {
        id: 'evt-2',
        title: 'Lease Renewal Expiration',
        date: new Date().toISOString().split('T')[0],
        type: 'lease',
        unitName: '202',
        propertyName: 'Skyline Residences',
    },
    {
        id: 'evt-3',
        title: 'Leaking Sink Inspection',
        date: new Date().toISOString().split('T')[0],
        type: 'maintenance',
        unitName: '303',
        propertyName: 'Skyline Residences',
    },
    {
        id: 'evt-4',
        title: 'Swimming Pool Reservation',
        date: new Date().toISOString().split('T')[0],
        type: 'booking',
        startTime: '14:00',
        endTime: '16:00',
        propertyName: 'Skyline Residences',
    }
];

describe('MobileCalendarView', () => {
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
        mockAddNote.mockClear();
        mockDeleteNote.mockClear();
        mockFetch.mockClear();
    });

    it('renders calendar events across categories and personal notes', async () => {
        render(<MobileCalendarView />);

        await waitFor(() => {
            expect(screen.getByText('Rent Due - Unit 101')).toBeDefined();
            expect(screen.getByText('Lease Renewal Expiration')).toBeDefined();
            expect(screen.getByText('Leaking Sink Inspection')).toBeDefined();
            expect(screen.getByText('Swimming Pool Reservation')).toBeDefined();
            expect(screen.getByText('Aircon Cleaning Service')).toBeDefined();
        });
    });

    it('filters events by category pills', async () => {
        render(<MobileCalendarView />);

        await waitFor(() => screen.getByText('Rent Due - Unit 101'));

        // Filter by Rent Dues
        const rentDuesTab = screen.getByRole('button', { name: /Rent Dues/i });
        fireEvent.click(rentDuesTab);

        await waitFor(() => {
            expect(screen.getByText('Rent Due - Unit 101')).toBeDefined();
            expect(screen.queryByText('Lease Renewal Expiration')).toBeNull();
            expect(screen.queryByText('Leaking Sink Inspection')).toBeNull();
        });

        // Filter by Notes
        const notesTab = screen.getByRole('button', { name: /Notes/i });
        fireEvent.click(notesTab);

        await waitFor(() => {
            expect(screen.getByText('Aircon Cleaning Service')).toBeDefined();
            expect(screen.queryByText('Rent Due - Unit 101')).toBeNull();
        });
    });

    it('opens add note modal and submits personal reminder', async () => {
        render(<MobileCalendarView />);

        // Tap Add Note button in header
        const addNoteBtn = screen.getByLabelText('Add Note');
        fireEvent.click(addNoteBtn);

        await waitFor(() => {
            expect(screen.getByText('Add Reminder Note')).toBeDefined();
        });

        // Fill form
        const titleInput = screen.getByPlaceholderText(/Aircon maintenance/i);
        fireEvent.change(titleInput, { target: { value: 'Contractor meeting' } });

        const descInput = screen.getByPlaceholderText(/Add extra details/i);
        fireEvent.change(descInput, { target: { value: 'Discuss lobby repaint quote' } });

        // Save
        const saveBtn = screen.getByRole('button', { name: /Save Note/i });
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(mockAddNote).toHaveBeenCalledWith(
                expect.any(String),
                'Contractor meeting',
                'Discuss lobby repaint quote'
            );
        });
    });

    it('deletes a personal note with trash icon', async () => {
        render(<MobileCalendarView />);

        await waitFor(() => screen.getByText('Aircon Cleaning Service'));

        const deleteBtn = screen.getByLabelText('Delete note');
        fireEvent.click(deleteBtn);

        await waitFor(() => {
            expect(mockDeleteNote).toHaveBeenCalledWith('note-1');
        });
    });

    it('navigates weeks using arrow buttons', async () => {
        render(<MobileCalendarView />);

        await waitFor(() => screen.getByLabelText('Next week'));

        const nextWeekBtn = screen.getByLabelText('Next week');
        fireEvent.click(nextWeekBtn);

        // Week offset changed -> Today button appears
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Today/i })).toBeDefined();
        });

        // Click Today to snap back
        fireEvent.click(screen.getByRole('button', { name: /Today/i }));

        await waitFor(() => {
            expect(screen.queryByRole('button', { name: /^Today$/i })).toBeNull();
        });
    });
});
