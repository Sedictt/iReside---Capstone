import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { LandlordLeasesView } from '../LandlordLeasesView';

// Mock useRouter & useSearchParams
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
    useSearchParams: () => ({
        get: vi.fn().mockImplementation((param) => null),
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
        language: 'en',
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

// Mock LeaseModal
vi.mock('@/components/tenant/LeaseModal', () => ({
    default: () => <div data-testid="mock-lease-modal">LeaseModal</div>,
}));

// Mock PullToRefresh
vi.mock('@/components/mobile/shared/PullToRefresh', () => ({
    PullToRefresh: ({ children }: any) => <div>{children}</div>,
}));

// Mock MobilePropertySelector
vi.mock('@/components/mobile/shared/MobilePropertySelector', () => ({
    MobilePropertySelector: () => <div data-testid="mobile-property-selector">Selector</div>,
}));

const mockLeases = [
    {
        id: 'lease-1',
        status: 'active',
        start_date: '2026-01-01',
        end_date: null,
        term_type: 'open_ended',
        monthly_rent: 18000,
        security_deposit: 18000,
        signed_at: '2026-01-01T00:00:00Z',
        created_at: '2025-12-15T00:00:00Z',
        unit: {
            id: 'unit-1',
            name: 'Unit 101',
            beds: 1,
            baths: 1,
            property: { id: 'prop-1', name: 'Grand Residences', address: '123 Main St' }
        },
        tenant: {
            id: 'tenant-1',
            full_name: 'Maria Santos',
            email: 'maria@example.com',
            phone: '09171234567'
        }
    },
    {
        id: 'lease-2',
        status: 'pending_tenant_signature',
        start_date: '2026-11-01',
        end_date: '2027-10-31',
        term_type: 'fixed',
        monthly_rent: 22000,
        security_deposit: 22000,
        signed_at: null,
        created_at: '2026-10-10T00:00:00Z',
        unit: {
            id: 'unit-2',
            name: 'Unit 202',
            beds: 2,
            baths: 1,
            property: { id: 'prop-1', name: 'Grand Residences', address: '123 Main St' }
        },
        tenant: {
            id: 'tenant-2',
            full_name: 'Juan Dela Cruz',
            email: 'juan@example.com',
            phone: '09189876543'
        }
    }
];

const mockRenewals = [
    {
        id: 'ren-1',
        status: 'pending',
        created_at: '2026-10-12T00:00:00Z',
        proposed_start_date: '2027-01-01',
        proposed_end_date: '2027-12-31',
        proposed_monthly_rent: 19500,
        proposed_security_deposit: 19500,
        current_lease: {
            id: 'lease-1',
            start_date: '2026-01-01',
            end_date: '2026-12-31',
            term_type: 'fixed',
            monthly_rent: 18000,
            security_deposit: 18000,
            unit: {
                id: 'unit-1',
                name: 'Unit 101',
                beds: 1,
                baths: 1,
                property: { id: 'prop-1', name: 'Grand Residences', address: '123 Main St' }
            },
            tenant: {
                id: 'tenant-1',
                full_name: 'Maria Santos',
                email: 'maria@example.com',
                phone: '09171234567'
            }
        }
    }
];

describe('LandlordLeasesView', () => {
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
        vi.clearAllMocks();
        originalFetch = global.fetch;

        global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
            if (url.includes('/api/landlord/leases') && !url.includes('/signing-link') && !url.includes('/term')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockLeases),
                });
            }
            if (url.includes('/api/landlord/renewals')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockRenewals),
                });
            }
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });
        }) as any;
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('renders lease agreements and switches to renewals tab', async () => {
        render(<LandlordLeasesView />);

        await waitFor(() => {
            expect(screen.getByText('Unit Unit 101')).toBeDefined();
            expect(screen.getByText('Maria Santos')).toBeDefined();
            expect(screen.getByText('Unit Unit 202')).toBeDefined();
        });

        // Switch to renewals tab
        const renewalsTab = screen.getByRole('button', { name: /Renewals/i });
        fireEvent.click(renewalsTab);

        await waitFor(() => {
            expect(screen.getByText('Approve')).toBeDefined();
            expect(screen.getByText('Decline')).toBeDefined();
        });
    });

    it('approves renewal request with interactive term and rent overrides', async () => {
        render(<LandlordLeasesView />);

        // Switch to renewals tab
        await waitFor(() => screen.getByRole('button', { name: /Renewals/i }));
        fireEvent.click(screen.getByRole('button', { name: /Renewals/i }));

        await waitFor(() => screen.getByText('Approve'));
        fireEvent.click(screen.getByText('Approve'));

        // Check modal appeared
        await waitFor(() => {
            expect(screen.getByText('Approve Lease Extension')).toBeDefined();
        });

        // Verify inputs are pre-populated
        const rentInput = screen.getAllByPlaceholderText('0.00')[0] as HTMLInputElement;
        expect(rentInput).toBeDefined();

        // Adjust rent to 20000
        fireEvent.change(rentInput, { target: { value: '20000' } });

        // Submit approval
        const confirmBtn = screen.getByText('Confirm Approval');
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/landlord/renewals/ren-1',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('"proposed_monthly_rent":20000'),
                })
            );
        });
    });

    it('declines renewal request with preset chips and custom reason', async () => {
        render(<LandlordLeasesView />);

        // Switch to renewals tab
        await waitFor(() => screen.getByRole('button', { name: /Renewals/i }));
        fireEvent.click(screen.getByRole('button', { name: /Renewals/i }));

        await waitFor(() => screen.getByText('Decline'));
        fireEvent.click(screen.getByText('Decline'));

        // Check decline modal
        await waitFor(() => {
            expect(screen.getByText('Decline Renewal Request')).toBeDefined();
        });

        // Click preset chip
        const chip = screen.getByRole('button', { name: /Property scheduled for renovation/i });
        fireEvent.click(chip);

        const textarea = screen.getByPlaceholderText(/Scheduled unit maintenance/i) as HTMLTextAreaElement;
        expect(textarea.value).toBe('Property scheduled for renovation');

        // Confirm Decline
        const confirmDeclineBtn = screen.getByText('Confirm Decline');
        fireEvent.click(confirmDeclineBtn);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/landlord/renewals/ren-1',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('"landlord_notes":"Property scheduled for renovation"'),
                })
            );
        });
    });

    it('switches lease term from month-to-month to fixed-term via PATCH /term', async () => {
        render(<LandlordLeasesView />);

        await waitFor(() => screen.getByText('Unit Unit 101'));

        // Click Month-to-Month term button
        const termButton = screen.getAllByLabelText('Change lease term')[0];
        fireEvent.click(termButton);

        // Check term switch modal appeared
        await waitFor(() => {
            expect(screen.getByText('Change Lease Term')).toBeDefined();
        });

        // Click fixed term duration preset +1 Yr
        const presetYr = screen.getByRole('button', { name: '+1 Yr' });
        fireEvent.click(presetYr);

        // Click Save Changes
        const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/landlord/leases/lease-1/term',
                expect.objectContaining({
                    method: 'PATCH',
                    body: expect.stringContaining('"term_type":"fixed"'),
                })
            );
        });
    });

    it('shares or copies signing link for pending signature leases', async () => {
        const mockClipboard = {
            writeText: vi.fn().mockResolvedValue(undefined),
        };
        Object.assign(navigator, { clipboard: mockClipboard });

        render(<LandlordLeasesView />);

        await waitFor(() => screen.getByText('Unit Unit 202'));

        // Unit 202 is pending_tenant_signature so it has Share Signing Link
        const shareBtn = screen.getByRole('button', { name: /Share signing link/i });
        expect(shareBtn).toBeDefined();

        (global.fetch as any).mockImplementationOnce((url: string) => {
            if (url.includes('/signing-link')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true, signingUrl: 'https://ireside.ph/sign/xyz123' }),
                });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        });

        fireEvent.click(shareBtn);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/landlord/leases/lease-2/signing-link',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ role: 'tenant' }),
                })
            );
            expect(mockClipboard.writeText).toHaveBeenCalledWith('https://ireside.ph/sign/xyz123');
        });
    });
});
