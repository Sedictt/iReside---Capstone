import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MobileCollectPaymentDrawer } from '../MobileCollectPaymentDrawer';

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

const mockInvoices = [
    {
        id: 'inv-1',
        invoice_number: 'INV-2026-001',
        tenant: 'Juan Dela Cruz',
        unit: '101-A',
        property: 'Pine Crest Residences',
        amount: 15000,
        balance_remaining: 15000,
        status: 'overdue',
        due_date: '2026-10-01',
    },
    {
        id: 'inv-2',
        invoice_number: 'INV-2026-002',
        tenant: 'Maria Santos',
        unit: '204-B',
        property: 'Pine Crest Residences',
        amount: 12000,
        balance_remaining: 6000,
        status: 'pending',
        due_date: '2026-10-20',
    },
];

describe('MobileCollectPaymentDrawer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
            const urlStr = String(url);
            const method = options?.method ? options.method.toUpperCase() : 'GET';

            if (urlStr.includes('/api/landlord/invoices') && method === 'GET') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ invoices: mockInvoices }),
                });
            }

            if (urlStr.includes('/api/landlord/payments/collect') && method === 'POST') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        ok: true,
                        receiptNumber: 'OR-2026-8891',
                        isFullyPaid: true,
                        balanceRemaining: 0,
                    }),
                });
            }

            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({}),
            });
        }) as any;
    });

    it('renders collectible invoices and auto-selects first invoice', async () => {
        render(
            <MobileCollectPaymentDrawer
                isOpen={true}
                onClose={vi.fn()}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
            expect(screen.getByText('Maria Santos')).toBeInTheDocument();
        });
    });

    it('switches payment method to GCash or Bank', async () => {
        render(
            <MobileCollectPaymentDrawer
                isOpen={true}
                onClose={vi.fn()}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('GCash')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('GCash'));
        expect(screen.getByPlaceholderText('e.g. 10294821')).toBeInTheDocument();
    });

    it('submits offline cash collection and displays digital receipt card', async () => {
        const onPaymentRecordedMock = vi.fn();
        render(
            <MobileCollectPaymentDrawer
                isOpen={true}
                onClose={vi.fn()}
                onPaymentRecorded={onPaymentRecordedMock}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Record Collection')).toBeInTheDocument();
        });

        const submitButton = screen.getByText('Record Collection');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/landlord/payments/collect'),
                expect.objectContaining({
                    method: 'POST',
                })
            );
            expect(screen.getByText('#OR-2026-8891')).toBeInTheDocument();
            expect(screen.getByText('Done & Return to Ledger')).toBeInTheDocument();
            expect(onPaymentRecordedMock).toHaveBeenCalled();
        });
    });
});