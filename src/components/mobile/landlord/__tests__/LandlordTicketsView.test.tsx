import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { LandlordTicketsView } from '../LandlordTicketsView';

vi.mock('next/navigation', () => ({
    useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
}));

vi.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => <img {...props} alt={props.alt || ''} />,
}));

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

vi.mock('@/lib/haptics', () => ({
    triggerHaptic: vi.fn(),
}));

vi.mock('@/components/mobile/shared/PullToRefresh', () => ({
    PullToRefresh: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/mobile/shared/MobilePropertySelector', () => ({
    MobilePropertySelector: () => <div data-testid="property-selector">Dorm</div>,
}));

describe('LandlordTicketsView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
            if (opts?.method === 'PATCH') {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ request: { id: 't-1', status: 'In Progress' } }),
                });
            }
            if (url.includes('/api/landlord/maintenance')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        requests: [
                            {
                                id: 't-1',
                                title: 'Wall outlet sparking when aircon is plugged in',
                                description: 'May spark sa outlet malapit sa aircon.',
                                status: 'Pending',
                                priority: 'Critical',
                                property: 'Fernando Gonzales Dormitory',
                                unit: 'Room 202',
                                tenant: 'Mark Anthony Lim',
                                reportedAt: '2 days ago',
                                images: ['https://example.com/outlet-1.jpg', 'https://example.com/outlet-2.jpg'],
                            },
                            {
                                id: 't-2',
                                title: 'Loose bathroom faucet',
                                description: 'Dripping steadily.',
                                status: 'Pending',
                                priority: 'High',
                                property: 'Fernando Gonzales Dormitory',
                                unit: 'Room 101',
                                tenant: 'Ana Reyes',
                                reportedAt: 'Yesterday',
                                images: [],
                            },
                            {
                                id: 't-3',
                                title: 'Weak Wi-Fi signal',
                                description: '2nd floor corner room drops connection.',
                                status: 'In Progress',
                                priority: 'Normal',
                                property: 'Fernando Gonzales Dormitory',
                                unit: 'Room 204',
                                tenant: 'Christine Reyes',
                                reportedAt: 'Today',
                                images: [],
                            },
                            {
                                id: 't-4',
                                title: 'Bedroom door hinge squeak',
                                description: 'Needs oiling.',
                                status: 'In Progress',
                                priority: 'Low',
                                property: 'Fernando Gonzales Dormitory',
                                unit: 'Room 301',
                                tenant: 'Daniel Ocampo',
                                reportedAt: '3 days ago',
                                images: [],
                            },
                            {
                                id: 't-5',
                                title: 'Shower head replacement',
                                description: 'Completed last week.',
                                status: 'Resolved',
                                priority: 'Low',
                                property: 'Fernando Gonzales Dormitory',
                                unit: 'Room 105',
                                tenant: 'Ronald Bautista',
                                reportedAt: 'Nov 2, 2026',
                                images: [],
                            },
                        ],
                    }),
                });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });
    });

    it('renders room, tenant, and relative date accurately and paginates 4 cards per page', async () => {
        render(<LandlordTicketsView />);

        await waitFor(() => {
            expect(screen.getByText('Wall outlet sparking when aircon is plugged in')).toBeInTheDocument();
        });

        // Properly maps room unit, full untruncated tenant attribution, and relative reportedAt (never Unit N/A)
        expect(screen.getByText('Room 202')).toBeInTheDocument();
        expect(screen.getByText('Mark Anthony Lim')).toBeInTheDocument();
        expect(screen.getByText('2 days ago')).toBeInTheDocument();
        expect(screen.queryByText(/Unit N\/A/i)).not.toBeInTheDocument();

        // Symmetrical 4-tab filter segmented bar
        expect(screen.getAllByRole('tab')).toHaveLength(4);

        // Side-anchored multi-photo thumbnail shows +1 count and opens photo viewer dialog
        expect(screen.getByText('+1')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Inspect issue photo 1/i }));
        expect(screen.getByRole('dialog', { name: /Issue photo viewer/i })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Close photo/i }));
        expect(screen.queryByRole('dialog', { name: /Issue photo viewer/i })).not.toBeInTheDocument();

        // Pagination shows first 4 items on page 1, hides 5th until Next is clicked
        expect(screen.getByText('Showing 1–4 of 5')).toBeInTheDocument();
        expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
        expect(screen.queryByText('Shower head replacement')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Next page/i }));
        expect(screen.getByText('Shower head replacement')).toBeInTheDocument();
        expect(screen.getByText('Showing 5–5 of 5')).toBeInTheDocument();
    });

    it('filters by search and resets via empty state Clear All Filters', async () => {
        render(<LandlordTicketsView />);

        await waitFor(() => {
            expect(screen.getByText('Wall outlet sparking when aircon is plugged in')).toBeInTheDocument();
        });

        const searchInput = screen.getByLabelText(/Search repair requests/i);
        fireEvent.change(searchInput, { target: { value: 'nonexistent-issue-xyz' } });

        expect(screen.getByText(/No requests match "nonexistent-issue-xyz"/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Clear All Filters/i }));
        expect(screen.getByText('Wall outlet sparking when aircon is plugged in')).toBeInTheDocument();
    });
});
