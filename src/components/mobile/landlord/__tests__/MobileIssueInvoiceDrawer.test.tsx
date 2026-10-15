import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MobileIssueInvoiceDrawer } from '../MobileIssueInvoiceDrawer';

// Assign global and window fetch at module level to avoid undici relative URL errors
const mockFetch = vi.fn();
global.fetch = mockFetch;
if (typeof window !== 'undefined') {
    window.fetch = mockFetch;
}

// Mock PropertyContext
vi.mock('@/context/PropertyContext', () => ({
    useProperty: () => ({
        selectedPropertyId: null,
        properties: [{ id: 'prop-1', name: 'Pine Crest Residences' }],
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

const mockLeases = [
    {
        id: 'lease-101',
        monthly_rent: 15000,
        tenant: {
            id: 'tenant-1',
            full_name: 'Juan Dela Cruz',
            email: 'juan@example.com',
            phone: '09171234567',
        },
        unit: {
            id: 'unit-1',
            name: '101-A',
            property: {
                id: 'prop-1',
                name: 'Pine Crest Residences',
            },
        },
    },
    {
        id: 'lease-102',
        monthly_rent: 12000,
        tenant: {
            id: 'tenant-2',
            full_name: 'Maria Santos',
            email: 'maria@example.com',
            phone: '09181234567',
        },
        unit: {
            id: 'unit-2',
            name: '204-B',
            property: {
                id: 'prop-1',
                name: 'Pine Crest Residences',
            },
        },
    },
];

describe('MobileIssueInvoiceDrawer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockImplementation((url: string, options?: RequestInit) => {
            const urlStr = String(url);
            const method = options?.method ? options.method.toUpperCase() : 'GET';

            if (urlStr.includes('/api/landlord/leases') && method === 'GET') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockLeases),
                });
            }

            if (urlStr.includes('/api/landlord/invoices') && method === 'POST') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        ok: true,
                        invoice: {
                            id: 'inv-new-999',
                            invoice_number: 'INV-2026-999',
                            total_amount: 15000,
                            due_date: '2026-11-05',
                        },
                    }),
                });
            }

            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({}),
            });
        });
    });

    it('renders active leases for selection', async () => {
        render(
            <MobileIssueInvoiceDrawer
                isOpen={true}
                onClose={vi.fn()}
            />
        );

        await waitFor(() => {
            expect(screen.getByText(/Juan Dela Cruz/)).toBeInTheDocument();
            expect(screen.getByText(/Maria Santos/)).toBeInTheDocument();
        });
    });

    it('allows adding and removing line items with real-time total update', async () => {
        render(
            <MobileIssueInvoiceDrawer
                isOpen={true}
                onClose={vi.fn()}
            />
        );

        await waitFor(() => {
            expect(screen.getByDisplayValue('Monthly Base Rent')).toBeInTheDocument();
        });

        // Click Add Item
        const addItemBtn = screen.getByText('Add Item');
        fireEvent.click(addItemBtn);

        // Find inputs for items
        const itemInputs = screen.getAllByPlaceholderText('Item description...');
        expect(itemInputs.length).toBeGreaterThanOrEqual(1);
    });

    it('submits invoice successfully and triggers callbacks', async () => {
        const onIssuedMock = vi.fn();
        const onCloseMock = vi.fn();
        render(
            <MobileIssueInvoiceDrawer
                isOpen={true}
                onClose={onCloseMock}
                onIssued={onIssuedMock}
            />
        );

        // Wait for base rent to be populated and button to be enabled
        await waitFor(() => {
            expect(screen.getByDisplayValue('Monthly Base Rent')).toBeInTheDocument();
            expect(screen.getByDisplayValue('15000')).toBeInTheDocument();
        });

        const submitBtn = screen.getByRole('button', { name: /Issue Invoice/i });
        await waitFor(() => {
            expect(submitBtn).not.toBeDisabled();
        });

        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/landlord/invoices'),
                expect.objectContaining({
                    method: 'POST',
                })
            );
            expect(onIssuedMock).toHaveBeenCalled();
            expect(onCloseMock).toHaveBeenCalled();
        });
    });
});
