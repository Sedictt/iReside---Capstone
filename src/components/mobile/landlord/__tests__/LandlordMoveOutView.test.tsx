import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { LandlordMoveOutView } from '../LandlordMoveOutView';

// Mock router
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
    }),
}));

// Mock PropertyContext
vi.mock('@/context/PropertyContext', () => ({
    useProperty: () => ({
        currentProperty: null,
        selectedPropertyId: null,
        properties: [],
    }),
}));

// Mock mobile shared components
vi.mock('@/components/mobile/shared/PullToRefresh', () => ({
    PullToRefresh: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/mobile/shared/MobilePropertySelector', () => ({
    MobilePropertySelector: () => <div data-testid="mobile-property-selector" />,
}));

// Mock haptics & notifications
vi.mock('@/lib/haptics', () => ({
    triggerHaptic: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

const mockMoveOutRequests = [
    {
        id: 'req-pending-1',
        status: 'pending',
        intended_move_out_date: '2026-10-31',
        inspection_date: null,
        reason: 'Relocating for work opportunity',
        created_at: '2026-10-01T10:00:00Z',
        lease: {
            id: 'lease-1',
            security_deposit: 15000,
            unit: {
                name: '101-A',
                property: {
                    id: 'prop-1',
                    name: 'Pine Crest Residences',
                },
            },
            tenant: {
                full_name: 'Juan Dela Cruz',
                phone: '09171234567',
            },
        },
    },
    {
        id: 'req-approved-2',
        status: 'approved',
        intended_move_out_date: '2026-10-25',
        inspection_date: '2026-10-24',
        reason: 'End of contract',
        created_at: '2026-09-25T10:00:00Z',
        lease: {
            id: 'lease-2',
            security_deposit: 20000,
            unit: {
                name: '204-B',
                property: {
                    id: 'prop-1',
                    name: 'Pine Crest Residences',
                },
            },
            tenant: {
                full_name: 'Maria Santos',
                phone: '09189876543',
            },
        },
    },
];

const mockClearanceData = {
    rent_settled: false,
    utilities_settled: false,
    outstanding_balance: 3000,
    water_balance: 500,
    electricity_balance: 1000,
    pending_readings: 1,
};

describe('LandlordMoveOutView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
            const urlStr = String(url);
            const method = options?.method ? options.method.toUpperCase() : 'GET';

            if (urlStr.includes('/inspection')) {
                if (method === 'POST') {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ success: true }),
                    });
                }
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockClearanceData),
                });
            }

            if (urlStr.includes('/approve') && method === 'PUT') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true }),
                });
            }

            if (urlStr.includes('/deny') && method === 'PUT') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true }),
                });
            }

            if (urlStr.includes('/complete') && method === 'PUT') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true }),
                });
            }

            if (urlStr.includes('/api/landlord/move-out')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockMoveOutRequests),
                });
            }

            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({}),
            });
        }) as any;
    });

    it('renders move out requests and displays pending notice cards', async () => {
        render(<LandlordMoveOutView />);

        await waitFor(() => {
            expect(screen.getByText(/Juan Dela Cruz/)).toBeInTheDocument();
            expect(screen.getByText(/Relocating for work opportunity/)).toBeInTheDocument();
        });
    });

    it('acknowledges and schedules move-out notice', async () => {
        render(<LandlordMoveOutView />);

        await waitFor(() => {
            expect(screen.getByText('Acknowledge & Schedule')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Acknowledge & Schedule'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/landlord/move-out/req-pending-1/approve'),
                expect.objectContaining({ method: 'PUT' })
            );
        });
    });

    it('opens denial modal and declines notice with a reason', async () => {
        render(<LandlordMoveOutView />);

        await waitFor(() => {
            expect(screen.getByText('Decline')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Decline'));

        expect(screen.getByText('Decline Move-Out Notice')).toBeInTheDocument();

        const reasonInput = screen.getByPlaceholderText(/30-day notice minimum not satisfied/);
        fireEvent.change(reasonInput, { target: { value: 'Advance notice policy requires minimum 30 days.' } });

        const confirmButton = screen.getByText('Confirm Decline');
        expect(confirmButton).not.toBeDisabled();
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/landlord/move-out/req-pending-1/deny'),
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify({ denial_reason: 'Advance notice policy requires minimum 30 days.' }),
                })
            );
        });
    });

    it('opens walkthrough inspection drawer and applies unpaid dues to deductions', async () => {
        render(<LandlordMoveOutView />);

        await waitFor(() => {
            expect(screen.getByText('Inspection')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Inspection'));

        await waitFor(() => {
            expect(screen.getByText('Conduct Walkthrough')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Conduct Walkthrough'));

        // Verify turnkey walkthrough drawer is opened and clearance audit is rendered
        await waitFor(() => {
            expect(screen.getByText('Turnkey Inspection')).toBeInTheDocument();
            expect(screen.getByText(/Apply Unpaid Dues/)).toBeInTheDocument();
        });

        // Click apply total unpaid dues (3000 rent + 500 water + 1000 power = 4500)
        const applyDuesButton = screen.getByText(/Apply Unpaid Dues/);
        fireEvent.click(applyDuesButton);

        // Deductions input should reflect 4500
        const deductionsInput = screen.getByPlaceholderText('0.00') as HTMLInputElement;
        expect(deductionsInput.value).toBe('4500');

        // Complete & Release Unit
        const completeButton = screen.getByText('Complete & Release Unit');
        fireEvent.click(completeButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/landlord/move-out/req-approved-2/inspection'),
                expect.objectContaining({ method: 'POST' })
            );
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/landlord/move-out/req-approved-2/complete'),
                expect.objectContaining({ method: 'PUT' })
            );
        });
    });
});