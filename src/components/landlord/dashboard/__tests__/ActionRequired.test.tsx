import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ActionRequired } from '../ActionRequired';

vi.mock('@/context/PropertyContext', () => ({
    useProperty: () => ({
        selectedPropertyId: 'prop-1',
    }),
}));

vi.mock('@/context/LanguageContext', () => ({
    useLanguageContext: () => ({
        t: (str: string, vars?: Record<string, string | number>) => {
            if (!vars) return str;
            let res = str;
            Object.keys(vars).forEach((k) => {
                res = res.replace(`{${k}}`, String(vars[k]));
            });
            return res;
        },
        locale: 'en-US',
        language: 'en',
    }),
}));

describe('ActionRequired (Needs Your Attention)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn().mockImplementation((url: string) => {
            if (url.includes('/api/landlord/maintenance')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        requests: [
                            { id: 'm-1', title: 'Leaking pipe', property: 'Sun', unit: '101', tenant: 'Tenant 1', priority: 'Critical', status: 'Pending', reportedAt: '2 days ago' },
                            { id: 'm-2', title: 'Broken fan', property: 'Sun', unit: '102', tenant: 'Tenant 2', priority: 'High', status: 'Pending', reportedAt: 'Yesterday' },
                            { id: 'm-3', title: 'Loose lock', property: 'Sun', unit: '103', tenant: 'Tenant 3', priority: 'Normal', status: 'Pending', reportedAt: 'Today' },
                            { id: 'm-4', title: 'Flickering bulb', property: 'Sun', unit: '104', tenant: 'Tenant 4', priority: 'Normal', status: 'Pending', reportedAt: '2026-11-01T00:00:00Z' },
                            { id: 'm-5', title: 'Weak wifi', property: 'Sun', unit: '105', tenant: 'Tenant 5', priority: 'Normal', status: 'Pending', reportedAt: '3 days ago' },
                        ],
                    }),
                });
            }
            if (url.includes('/api/landlord/tenants')) {
                return Promise.resolve({ ok: true, json: async () => ({ tenants: [] }) });
            }
            if (url.includes('/api/messages/conversations')) {
                return Promise.resolve({ ok: true, json: async () => ({ conversations: [] }) });
            }
            if (url.includes('/api/landlord/applications')) {
                return Promise.resolve({ ok: true, json: async () => ({ applications: [] }) });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });
    });

    it('paginates mobile items 3 per page, avoids Invalid Date, and uses mobile routes', async () => {
        render(<ActionRequired variant="mobile" />);

        await waitFor(() => {
            expect(screen.getByText(/Tenant 1: Leaking pipe/i)).toBeInTheDocument();
        });

        // Page 1 shows items 1-3 only
        expect(screen.getByText(/Tenant 2: Broken fan/i)).toBeInTheDocument();
        expect(screen.getByText(/Tenant 3: Loose lock/i)).toBeInTheDocument();
        expect(screen.queryByText(/Tenant 4: Flickering bulb/i)).not.toBeInTheDocument();

        // Relative date string should not turn into Invalid Date
        expect(screen.getByText(/Reported 2 days ago/i)).toBeInTheDocument();
        expect(screen.queryByText(/Invalid Date/i)).not.toBeInTheDocument();

        // Action links resolve to mobile tickets route
        const dispatchLinks = screen.getAllByRole('link', { name: /Dispatch Tech/i });
        expect(dispatchLinks[0]).toHaveAttribute('href', '/mobile/landlord/tickets?id=m-1');

        // Pagination info and navigation
        expect(screen.getByText('Showing 1–3 of 5')).toBeInTheDocument();
        expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();

        const nextBtn = screen.getByRole('button', { name: /Next page/i });
        fireEvent.click(nextBtn);

        await waitFor(() => {
            expect(screen.getByText(/Tenant 4: Flickering bulb/i)).toBeInTheDocument();
        });
        expect(screen.getByText(/Tenant 5: Weak wifi/i)).toBeInTheDocument();
        expect(screen.queryByText(/Tenant 1: Leaking pipe/i)).not.toBeInTheDocument();
        expect(screen.getByText('Showing 4–5 of 5')).toBeInTheDocument();
        expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    });
});
