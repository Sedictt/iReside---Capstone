import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MobileRecordExpenseDrawer } from '../MobileRecordExpenseDrawer';

// Assign global and window fetch at module level
const mockFetch = vi.fn();
global.fetch = mockFetch;
if (typeof window !== 'undefined') {
    window.fetch = mockFetch;
}

// Mock PropertyContext
vi.mock('@/context/PropertyContext', () => ({
    useProperty: () => ({
        selectedPropertyId: 'prop-1',
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

describe('MobileRecordExpenseDrawer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockImplementation((url: string, options?: RequestInit) => {
            const urlStr = String(url);
            const method = options?.method ? options.method.toUpperCase() : 'GET';

            if (urlStr.includes('/api/landlord/properties') && method === 'GET') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        properties: [{ id: 'prop-1', name: 'Pine Crest Residences' }],
                    }),
                });
            }

            if (urlStr.includes('/api/landlord/expenses') && method === 'POST') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        ok: true,
                        expense: {
                            id: 'exp-101',
                            category: 'maintenance',
                            amount: 2500,
                            description: 'Plumbing leak repair on 2nd floor',
                            date_incurred: '2026-10-14',
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

    it('renders category chips and fields', async () => {
        render(
            <MobileRecordExpenseDrawer
                isOpen={true}
                onClose={vi.fn()}
            />
        );

        expect(screen.getByText('Maintenance')).toBeInTheDocument();
        expect(screen.getByText('Utilities')).toBeInTheDocument();
        expect(screen.getByText('Taxes & Fees')).toBeInTheDocument();
        expect(screen.getByText('Other')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    });

    it('allows changing expense category chip', async () => {
        render(
            <MobileRecordExpenseDrawer
                isOpen={true}
                onClose={vi.fn()}
            />
        );

        const utilChip = screen.getByText('Utilities');
        fireEvent.click(utilChip);

        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '4500' } });
        expect(amountInput).toHaveValue(4500);
    });

    it('validates and submits expense successfully', async () => {
        const onSavedMock = vi.fn();
        const onCloseMock = vi.fn();
        render(
            <MobileRecordExpenseDrawer
                isOpen={true}
                onClose={onCloseMock}
                onSaved={onSavedMock}
            />
        );

        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '2500' } });

        const descInput = screen.getByPlaceholderText('e.g., Replaced hallway lightbulbs, Plumbing repairs, Trash collection fee...');
        fireEvent.change(descInput, { target: { value: 'Plumbing leak repair on 2nd floor' } });

        const submitBtn = screen.getByRole('button', { name: /Record Expense/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/landlord/expenses'),
                expect.objectContaining({
                    method: 'POST',
                })
            );
            expect(onSavedMock).toHaveBeenCalled();
            expect(onCloseMock).toHaveBeenCalled();
        });
    });
});
