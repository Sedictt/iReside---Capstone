import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import { LandlordOverviewView } from '../LandlordOverviewView';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
}));

// Mock next/image
vi.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => <img {...props} alt={props.alt || ''} />,
}));

// Mock AuthContext
vi.mock('@/context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'u-1', email: 'landlord@ireside.ph', user_metadata: { first_name: 'Maria' } },
        profile: { full_name: 'Maria Santos', role: 'landlord' },
        loading: false,
    }),
}));

// Mock PropertyContext
vi.mock('@/context/PropertyContext', () => ({
    useProperty: () => ({
        selectedPropertyId: 'prop-1',
        properties: [{ id: 'prop-1', name: 'Sunshine Residences' }],
    }),
}));

// Mock BrandContext
vi.mock('@/context/BrandContext', () => ({
    useBrand: () => ({
        bannerUrl: null,
    }),
}));

// Mock NotificationContext
vi.mock('@/context/NotificationContext', () => ({
    useNotifications: () => ({
        counts: { maintenance: 2, applications: 1, messages: 0 },
        unreadCount: 0,
    }),
}));

// Mock LanguageContext
vi.mock('@/context/LanguageContext', () => ({
    useLanguageContext: () => ({
        t: (str: string, vars?: any) => {
            if (!vars) return str;
            let res = str;
            Object.keys(vars).forEach((k) => {
                res = res.replace(`{${k}}`, vars[k]);
            });
            return res;
        },
        locale: 'en',
        language: 'en',
    }),
}));

// Mock haptics
vi.mock('@/lib/haptics', () => ({
    triggerHaptic: vi.fn(),
}));

// Mock sub-components
vi.mock('@/components/mobile/shared/PullToRefresh', () => ({
    PullToRefresh: ({ children }: any) => <div data-testid="pull-to-refresh">{children}</div>,
}));

vi.mock('@/components/mobile/shared/MobilePropertySelector', () => ({
    MobilePropertySelector: () => <div data-testid="property-selector">Sunshine Residences</div>,
}));

vi.mock('@/components/landlord/dashboard/ActionRequired', () => ({
    ActionRequired: () => <div data-testid="action-required-queue">Action Required Tasks</div>,
}));

vi.mock('@/components/landlord/dashboard/LandlordWelcomeLightbox', () => ({
    LandlordWelcomeLightbox: () => null,
}));

describe('LandlordOverviewView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn().mockImplementation((url: string) => {
            if (url.includes('/api/landlord/payments/overview')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        payments: {
                            Overdue: [
                                {
                                    id: 'inv-1',
                                    tenant: 'Juan Dela Cruz',
                                    unit: '101',
                                    amount: 8500,
                                    status: 'Overdue',
                                    date: 'Nov 1, 2026',
                                    avatar: null,
                                },
                            ],
                            'Near Due': [],
                            Paid: [],
                        },
                    }),
                });
            }
            if (url.includes('/api/landlord/property-units') || url.includes('/api/landlord/properties/overview')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        properties: [
                            {
                                id: 'prop-1',
                                name: 'Sunshine Residences',
                                units: [
                                    { id: 'u-1', name: '101', rentAmount: 8500, status: 'occupied' },
                                    { id: 'u-2', name: '102', rentAmount: 8500, status: 'available' },
                                ],
                            },
                        ],
                    }),
                });
            }
            if (url.includes('/api/landlord/invites')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ invites: [] }),
                });
            }
            if (url.includes('/api/landlord/move-out')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [],
                });
            }
            if (url.includes('/api/landlord/renewals')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [],
                });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });
    });

    it('renders hero banner with greeting and 4 primary actions', async () => {
        render(<LandlordOverviewView />);

        // Greeting
        expect(screen.getByText(/Welcome back, Maria/i)).toBeInTheDocument();

        // 4 primary touch actions
        expect(screen.getByText('Record')).toBeInTheDocument();
        expect(screen.getByText('New App')).toBeInTheDocument();
        expect(screen.getByText('Invite')).toBeInTheDocument();
        const applicationsLink = screen.getByRole('link', { name: /Applications/i });
        expect(applicationsLink).toHaveAttribute('href', '/mobile/landlord/applications');
        expect(applicationsLink).toHaveTextContent('1');
    });

    it("renders Today's Overview hub with unpaid rent and companion cards", async () => {
        render(<LandlordOverviewView />);

        expect(screen.getByText("Today's Overview")).toBeInTheDocument();
        expect(screen.getByText('Rent Payments')).toBeInTheDocument();
        expect(screen.getByText('Room Occupancy')).toBeInTheDocument();
        expect(screen.getByText('Repairs & Maintenance')).toBeInTheDocument();
    });

    it('renders progressive disclosure tabs and switches between them', async () => {
        render(<LandlordOverviewView />);

        // Initially in Rent & Payments tab
        const paymentsTabBtn = screen.getByRole('button', { name: /Rent & Payments/i });
        const utilitiesTabBtn = screen.getByRole('button', { name: /Water & Electricity/i });
        const contractsTabBtn = screen.getByRole('button', { name: /Contracts & Tasks/i });

        expect(paymentsTabBtn).toBeInTheDocument();
        expect(utilitiesTabBtn).toBeInTheDocument();
        expect(contractsTabBtn).toBeInTheDocument();

        // Click on Water & Electricity tab
        fireEvent.click(utilitiesTabBtn);
        expect(screen.getByText(/Monthly Submeter Cycle/i)).toBeInTheDocument();
        expect(screen.getByText(/Record Readings/i)).toBeInTheDocument();

        // Click on Contracts & Tasks tab
        fireEvent.click(contractsTabBtn);
        expect(screen.getByText('Action Required Tasks')).toBeInTheDocument();
        expect(screen.getByText(/View All Contracts/i)).toBeInTheDocument();
    });

    it('reveals complete grouped Quick Actions & Tools inside the peeking FAB bottom sheet', async () => {
        render(<LandlordOverviewView />);

        const fabButton = screen.getByRole('button', { name: /Show Quick Tools/i });
        expect(fabButton).toHaveAttribute('data-fab-state', 'peeking');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        // 1st interaction reveals the whole FAB pill
        fireEvent.click(fabButton);
        expect(fabButton).toHaveAttribute('data-fab-state', 'revealed');

        // 2nd click opens Quick Actions & Tools sheet
        fireEvent.click(fabButton);
        const toolsDialog = screen.getByRole('dialog', { name: /Quick Actions & Tools/i });
        expect(toolsDialog).toBeInTheDocument();
        expect(within(toolsDialog).getByText('Water & Electricity')).toBeInTheDocument();
        expect(within(toolsDialog).getByText('Bills & Receipts')).toBeInTheDocument();
        expect(within(toolsDialog).getByText('Interactive Unit Map')).toBeInTheDocument();
        expect(within(toolsDialog).getByText('My Properties')).toBeInTheDocument();
        expect(within(toolsDialog).getByText('Tenant Directory')).toBeInTheDocument();
        expect(within(toolsDialog).getByText('Lease Contracts')).toBeInTheDocument();
        expect(within(toolsDialog).getByText('Move-Out Requests')).toBeInTheDocument();
        expect(within(toolsDialog).getByText('Building Calendar')).toBeInTheDocument();
        expect(within(toolsDialog).getByText('Lobby Flyer')).toBeInTheDocument();
        expect(within(toolsDialog).getByText('Income & Reports')).toBeInTheDocument();
        expect(within(toolsDialog).getByText('Help & Manual')).toBeInTheDocument();
    });

    it('hides standalone renewal and move-out banner cards and shows count on Contracts & Tasks tab', async () => {
        const baseFetch = global.fetch as ReturnType<typeof vi.fn>;
        global.fetch = vi.fn().mockImplementation((url: string) => {
            if (url.includes('/api/landlord/move-out')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [{ id: 'mo-1', status: 'pending', property_id: 'prop-1' }],
                });
            }
            if (url.includes('/api/landlord/renewals')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [{ id: 'ren-1', status: 'pending', current_lease: { unit: { property_id: 'prop-1' } } }],
                });
            }
            return baseFetch(url);
        });

        render(<LandlordOverviewView />);

        const contractsTabBtn = screen.getByRole('button', { name: /Contracts & Tasks/i });
        await waitFor(() => {
            expect(contractsTabBtn).toHaveTextContent('2');
        });

        expect(screen.queryByText(/Pending Lease Renewal Request/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Pending Move-Out Request/i)).not.toBeInTheDocument();
    });
});
