import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MobileMoveOutDrawer } from '../MobileMoveOutDrawer';

const mockFetch = vi.fn();
global.fetch = mockFetch;
if (typeof window !== 'undefined') {
    window.fetch = mockFetch;
}

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

const mockApprovedRequest = {
    id: 'req-101',
    status: 'approved',
    requested_date: '2026-11-20',
    reason: 'Relocating to another city for work',
    created_at: '2026-10-15T08:00:00Z',
    approved_at: '2026-10-16T10:00:00Z',
    inspection_date: '2026-11-18',
    inspection_notes: 'Tenant scheduled for unit handover at 2PM',
    deposit_deductions: [
        { id: 'ded-1', description: 'Wall repaint retouch', amount: 1500 },
    ],
    deposit_refund_amount: 10500,
    checklist_completed: false,
    checklist_data: {
        items: [
            { id: 'keys', label: 'Return all physical keys & access fobs', completed: true },
            { id: 'bills', label: 'Clear all outstanding utility & submeter charges', completed: false },
            { id: 'clean', label: 'Clean unit and remove all personal belongings', completed: false },
            { id: 'address', label: 'Confirm forwarding address & phone number', completed: false },
        ],
    },
    landlord_name: 'Maria Santos',
};

describe('MobileMoveOutDrawer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders notice to vacate submission form when no active request exists', async () => {
        mockFetch.mockImplementation((url: string) => {
            if (url.includes('/api/tenant/lease/move-out/status')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ hasRequest: false, request: null }),
                });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(
            <MobileMoveOutDrawer
                isOpen={true}
                onClose={vi.fn()}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Notice to Vacate')).toBeInTheDocument();
            expect(screen.getByText('Minimum 30 Calendar Days Notice Required')).toBeInTheDocument();
            expect(screen.getByText('Submit Notice')).toBeInTheDocument();
        });
    });

    it('submits notice to vacate and triggers callback', async () => {
        const onSubmittedMock = vi.fn();
        mockFetch.mockImplementation((url: string, options?: RequestInit) => {
            const urlStr = String(url);
            const method = options?.method ? options.method.toUpperCase() : 'GET';

            if (urlStr.includes('/api/tenant/lease/move-out/status')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ hasRequest: false, request: null }),
                });
            }

            if (urlStr.includes('/api/tenant/lease/move-out') && method === 'POST') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true }),
                });
            }

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(
            <MobileMoveOutDrawer
                isOpen={true}
                onClose={vi.fn()}
                onSubmitted={onSubmittedMock}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Submit Notice')).toBeInTheDocument();
        });

        const textarea = screen.getByPlaceholderText('Reason for moving out, forwarding address, relocation notes...');
        fireEvent.change(textarea, { target: { value: 'Relocating to another city for work' } });

        const submitBtn = screen.getByRole('button', { name: /Submit Notice/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/tenant/lease/move-out'),
                expect.objectContaining({
                    method: 'POST',
                })
            );
            expect(onSubmittedMock).toHaveBeenCalled();
        });
    });

    it('renders clearance progress milestones and deposit deductions for approved request', async () => {
        mockFetch.mockImplementation((url: string) => {
            if (url.includes('/api/tenant/lease/move-out/status')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ hasRequest: true, request: mockApprovedRequest }),
                });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(
            <MobileMoveOutDrawer
                isOpen={true}
                onClose={vi.fn()}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Move-Out Clearance')).toBeInTheDocument();
            expect(screen.getByText('Move-Out Approved')).toBeInTheDocument();
            expect(screen.getByText('Room Inspection')).toBeInTheDocument();
            expect(screen.getByText('Wall repaint retouch')).toBeInTheDocument();
            expect(screen.getByText('-₱1,500')).toBeInTheDocument();
            expect(screen.getByText('₱10,500')).toBeInTheDocument();
        });
    });

    it('allows toggling clearance checklist items and calls checklist API', async () => {
        mockFetch.mockImplementation((url: string, options?: RequestInit) => {
            const urlStr = String(url);
            const method = options?.method ? options.method.toUpperCase() : 'GET';

            if (urlStr.includes('/api/tenant/lease/move-out/status')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ hasRequest: true, request: mockApprovedRequest }),
                });
            }

            if (urlStr.includes('/api/tenant/lease/move-out/checklist') && method === 'PUT') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true, checklist_completed: false }),
                });
            }

            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(
            <MobileMoveOutDrawer
                isOpen={true}
                onClose={vi.fn()}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Clearance Checklist')).toBeInTheDocument();
            expect(screen.getByText('Clear all outstanding utility & submeter charges')).toBeInTheDocument();
        });

        const checklistItemBtn = screen.getByText('Clear all outstanding utility & submeter charges');
        fireEvent.click(checklistItemBtn);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/tenant/lease/move-out/checklist'),
                expect.objectContaining({
                    method: 'PUT',
                })
            );
        });
    });
});
